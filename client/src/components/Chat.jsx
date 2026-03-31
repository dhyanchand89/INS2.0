import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  decryptMessage,
  encryptMessage,
  isUsingCustomSharedKey,
} from "../utils/crypto";

const formatClockTime = (timestamp) => {
  const value = timestamp ? new Date(timestamp) : new Date();
  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toUiMessage = (payload, direction) => {
  const safePayload = payload || {};

  return {
    ...safePayload,
    direction,
    decryptedContent: decryptMessage(safePayload.encryptedContent),
  };
};

function Chat({ apiUrl, token, user, onLogout }) {
  const socketRef = useRef(null);
  const socketUrl = useMemo(() => import.meta.env.VITE_SOCKET_URL || apiUrl, [apiUrl]);
  const keyStatus = isUsingCustomSharedKey
    ? "Custom shared key loaded"
    : "Using default demo key";

  const [receiverId, setReceiverId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("Connected");
      setError("");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("Disconnected");
    });

    socket.on("connect_error", (connectionError) => {
      setConnectionStatus("Connection failed");
      setError(connectionError.message || "Unable to connect socket");
    });

    socket.on("chat:receive", (payload) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        toUiMessage(payload, "incoming"),
      ]);
    });

    socket.on("chat:sent", (payload) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        toUiMessage(payload, "outgoing"),
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl, token]);

  const handleSend = (event) => {
    event.preventDefault();

    const socket = socketRef.current;
    if (!socket) {
      setError("Socket not connected");
      return;
    }

    const trimmedReceiverId = receiverId.trim();
    const trimmedMessage = messageInput.trim();

    if (!trimmedReceiverId || !trimmedMessage) {
      setError("Receiver ID and message are required");
      return;
    }

    setError("");
    const encryptedContent = encryptMessage(trimmedMessage);

    if (!encryptedContent) {
      setError("Encryption failed. Message was not sent.");
      return;
    }

    socket.emit(
      "chat:send",
      {
        receiverId: trimmedReceiverId,
        encryptedContent,
      },
      (acknowledgement) => {
        if (!acknowledgement || !acknowledgement.ok) {
          setError(acknowledgement?.message || "Message send failed");
          return;
        }

        setMessageInput("");
      }
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-8 pt-6 sm:p-8">
      <header className="glass-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">Secure Session</p>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Encrypted Chat Room</h1>
          <p className="mt-1 text-sm text-slate-600">
            Logged in as <span className="font-semibold text-slate-900">{user.username}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 break-all">Your user ID: {user.id}</p>
          <p className="mt-1 text-xs text-slate-500">AES key: {keyStatus}</p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-full border border-slate-900/10 bg-white/70 px-4 py-1.5 font-medium text-slate-700">
            Socket: {connectionStatus}
          </div>
          <button type="button" onClick={onLogout} className="secondary-button w-full sm:w-auto">
            Logout
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="glass-card h-fit space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Compose</h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter receiver ID and plaintext message. It is AES-encrypted in the browser before sending.
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <label className="block">
              <span className="field-label">Receiver ID</span>
              <input
                type="text"
                value={receiverId}
                onChange={(event) => setReceiverId(event.target.value)}
                className="field-input"
                placeholder="Paste receiver user ID"
                required
              />
            </label>

            <label className="block">
              <span className="field-label">Message input (plaintext)</span>
              <textarea
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                className="field-input min-h-28 resize-y"
                placeholder="Type message here"
                required
              />
            </label>

            {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

            <button type="submit" className="primary-button w-full">
              Send Message
            </button>
          </form>
        </aside>

        <section className="glass-card flex min-h-[60vh] flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-slate-900">Live Feed</h2>
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-slate-500">Real-time</p>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-900/10 bg-white/80 p-3 sm:p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet. Open this app in two tabs and exchange user IDs.</p>
            ) : (
              messages.map((message, index) => {
                const isOutgoing = message.direction === "outgoing";

                return (
                  <article
                    key={message.id || `${message.timestamp || "ts"}-${index}`}
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isOutgoing
                        ? "self-end bg-slate-900 text-slate-50"
                        : "self-start border border-slate-900/10 bg-teal-50 text-slate-800"
                    }`}
                  >
                    <p className="break-words text-[13px] font-medium leading-relaxed">
                      {message.decryptedContent}
                    </p>
                    <p className={`mt-2 break-words font-mono text-[11px] ${isOutgoing ? "text-slate-300" : "text-slate-500"}`}>
                      Ciphertext: {message.encryptedContent}
                    </p>
                    <p className={`mt-2 text-[11px] ${isOutgoing ? "text-slate-300" : "text-slate-500"}`}>
                      {isOutgoing ? "You" : "Incoming"} • {formatClockTime(message.timestamp)}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Chat;
