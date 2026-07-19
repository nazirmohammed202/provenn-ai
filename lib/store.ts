import "server-only";
import { Redis } from "@upstash/redis";
import { decryptJson, encryptJson } from "./crypto";
import type { StoredAnalysis } from "./types";

const TTL_SECONDS = 60 * 60 * 24;

type MemoryRow = { payload: string; expiresAt: number };

const globalStore = globalThis as typeof globalThis & {
  __provennMemory?: Map<string, MemoryRow>;
};

const memory =
  globalStore.__provennMemory ||
  (globalStore.__provennMemory = new Map<string, MemoryRow>());

function redisClient() {
  return process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
}

const key = (id: string) => `provenn:analysis:${id}`;

export async function saveAnalysis(item: StoredAnalysis) {
  const payload = encryptJson(item);
  const redis = redisClient();
  if (redis) {
    await redis.set(key(item.id), payload, { ex: TTL_SECONDS });
    return;
  }
  memory.set(item.id, {
    payload,
    expiresAt: Date.parse(item.expiresAt),
  });
}

export async function getAnalysis(id: string): Promise<StoredAnalysis | null> {
  const redis = redisClient();
  if (redis) {
    const payload = await redis.get<string>(key(id));
    if (!payload) return null;
    return decryptJson<StoredAnalysis>(payload);
  }

  const row = memory.get(id);
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    memory.delete(id);
    return null;
  }
  return decryptJson<StoredAnalysis>(row.payload);
}

export function toPublicAnalysis(item: StoredAnalysis) {
  const { extractedText: _extractedText, ...rest } = item;
  return rest;
}
