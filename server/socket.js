const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { Types } = require("mongoose");
const Message = require("./models/Message");

const onlineUsers = new Map();

const initializeSocket = (httpServer) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        return next(new Error("JWT secret is not configured"));
      }

      const tokenFromAuth = socket.handshake.auth?.token;
      const tokenFromHeader = socket.handshake.headers.authorization?.split(" ")[1];
      const token = tokenFromAuth || tokenFromHeader;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, jwtSecret);
      socket.user = { userId: decoded.userId };
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.user;
    onlineUsers.set(userId, socket.id);

    socket.emit("socket:connected", {
      userId,
      socketId: socket.id,
    });

    socket.on("chat:send", async (payload, callback) => {
      try {
        const { receiverId, encryptedContent } = payload || {};

        if (!receiverId || !encryptedContent) {
          const errorResponse = { ok: false, message: "receiverId and encryptedContent are required" };
          if (typeof callback === "function") {
            callback(errorResponse);
          }
          return;
        }

        if (!Types.ObjectId.isValid(receiverId)) {
          const errorResponse = { ok: false, message: "Invalid receiverId" };
          if (typeof callback === "function") {
            callback(errorResponse);
          }
          return;
        }

        const message = await Message.create({
          senderId: userId,
          receiverId,
          encryptedContent,
        });

        const chatMessage = {
          id: message._id.toString(),
          senderId: message.senderId.toString(),
          receiverId: message.receiverId.toString(),
          encryptedContent: message.encryptedContent,
          timestamp: message.timestamp,
        };

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("chat:receive", chatMessage);
        }

        socket.emit("chat:sent", chatMessage);

        if (typeof callback === "function") {
          callback({ ok: true, message: chatMessage });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ ok: false, message: "Failed to process message" });
        }
      }
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
