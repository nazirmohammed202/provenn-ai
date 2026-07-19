import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { saveAnalysis, getAnalysis, toPublicAnalysis } from "@/lib/store";
import type { StoredAnalysis } from "@/lib/types";

function sample(overrides: Partial<StoredAnalysis> = {}): StoredAnalysis {
  const createdAt = new Date();
  return {
    id: "id-1",
    hash: `0x${"11".repeat(32)}`,
    fileName: "a.txt",
    extractedText: "confidential body",
    analysis: {
      title: "A",
      contractType: "B",
      summary: "C",
      parties: [],
      paymentTerms: [],
      keyDates: [],
      obligations: [],
      risks: [],
      missingClauses: [],
      healthScore: 50,
      recommendations: [],
    },
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 86400000).toISOString(),
    ...overrides,
  };
}

describe("store retention", () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
  });

  afterEach(() => {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
  });

  it("round-trips encrypted analysis and strips extracted text publicly", async () => {
    const item = sample();
    await saveAnalysis(item);
    const loaded = await getAnalysis(item.id);
    expect(loaded?.extractedText).toBe("confidential body");
    expect(toPublicAnalysis(loaded!).extractedText).toBeUndefined();
  });

  it("expires in-memory records", async () => {
    const item = sample({
      id: "expired",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    await saveAnalysis(item);
    expect(await getAnalysis("expired")).toBeNull();
  });
});
