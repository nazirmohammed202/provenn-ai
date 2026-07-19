import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function keyBytes() {
  const raw = process.env.ENCRYPTION_KEY || process.env.COOKIE_SECRET || "local-development-secret";
  return createHash("sha256").update(raw).digest();
}

export function encryptJson<T>(value: T): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, keyBytes(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptJson<T>(payload: string): T {
  const bytes = Buffer.from(payload, "base64url");
  const iv = bytes.subarray(0, 12);
  const tag = bytes.subarray(12, 28);
  const data = bytes.subarray(28);
  const decipher = createDecipheriv(ALGO, keyBytes(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
