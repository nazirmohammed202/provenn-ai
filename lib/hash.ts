import { createHash } from "crypto";

export function hashDocument(data: Buffer | ArrayBuffer) {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  return `0x${createHash("sha256").update(bytes).digest("hex")}` as `0x${string}`;
}
