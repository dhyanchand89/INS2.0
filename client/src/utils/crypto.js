import CryptoJS from "crypto-js";

const SHARED_SECRET_KEY =
  import.meta.env.VITE_CHAT_SECRET_KEY || "nmamit_shared_secret_key_change_me";

export const encryptMessage = (plainText) => {
  if (!plainText) {
    return "";
  }

  return CryptoJS.AES.encrypt(plainText, SHARED_SECRET_KEY).toString();
};

export const decryptMessage = (cipherText) => {
  if (!cipherText) {
    return "";
  }

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SHARED_SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // If key mismatches, CryptoJS returns an empty UTF-8 string.
    return decrypted || "[Unable to decrypt: shared key mismatch]";
  } catch {
    return "[Unable to decrypt message]";
  }
};

export const isUsingCustomSharedKey = Boolean(import.meta.env.VITE_CHAT_SECRET_KEY);
