import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.GARMIN_ENCRYPTION_KEY ?? "default-key-change-me-in-production";

export function encryptPassword(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
}

export function decryptPassword(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
