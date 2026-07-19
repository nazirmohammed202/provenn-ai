import { Redis } from "@upstash/redis";
import type { StoredAnalysis } from "./types";
const memory = new Map<string, StoredAnalysis>();
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
const key = (id: string) => `provenn:analysis:${id}`;
export async function saveAnalysis(item: StoredAnalysis) { if (redis) await redis.set(key(item.id), item, { ex: 86400 }); else memory.set(item.id, item); }
export async function getAnalysis(id: string) { return redis ? await redis.get<StoredAnalysis>(key(id)) : memory.get(id) || null; }
