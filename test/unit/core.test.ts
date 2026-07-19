import { describe, expect, it } from "vitest";
import { hashDocument } from "@/lib/hash";
import { analysisSchema } from "@/lib/types";
import { mapServiceError } from "@/lib/errors";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

describe("hashDocument", () => {
  it("is deterministic for the same bytes", () => {
    const a = hashDocument(Buffer.from("hello provenn"));
    const b = hashDocument(Buffer.from("hello provenn"));
    expect(a).toBe(b);
    expect(a).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("changes when content changes", () => {
    expect(hashDocument(Buffer.from("a"))).not.toBe(
      hashDocument(Buffer.from("b")),
    );
  });
});

describe("analysisSchema", () => {
  it("parses a valid payload and fills defaults", () => {
    const parsed = analysisSchema.parse({
      title: "MSA",
      contractType: "Services",
      summary: "A master services agreement.",
      healthScore: 72,
      risks: [
        {
          title: "Termination",
          severity: "high",
          quotedClause: "Either party may terminate...",
          whyItMatters: "Short notice",
          recommendation: "Negotiate longer notice",
        },
      ],
    });
    expect(parsed.parties).toEqual([]);
    expect(parsed.risks[0].sectionReference).toBe(
      "Section reference unavailable",
    );
  });

  it("rejects invalid health scores", () => {
    expect(() =>
      analysisSchema.parse({
        title: "x",
        contractType: "y",
        summary: "z",
        healthScore: 140,
      }),
    ).toThrow();
  });
});

describe("encryptJson", () => {
  it("round-trips payloads", () => {
    const input = { id: "abc", text: "secret clause" };
    const encrypted = encryptJson(input);
    expect(encrypted).not.toContain("secret");
    expect(decryptJson(encrypted)).toEqual(input);
  });
});

describe("mapServiceError", () => {
  it("maps known upstream failures", () => {
    expect(mapServiceError(new Error("GEMINI_API_KEY missing"), "fallback")).toBe(
      "AI analysis is not configured.",
    );
    expect(
      mapServiceError(new Error("Managed Monad proof is not configured."), "x"),
    ).toBe("Managed Monad proof is not configured.");
  });
});

describe("rateLimit", () => {
  it("blocks after the configured threshold", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 2).ok).toBe(true);
    expect(rateLimit(key, 2).ok).toBe(true);
    expect(rateLimit(key, 2).ok).toBe(false);
  });
});
