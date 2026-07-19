import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/store", () => ({
  getAnalysis: vi.fn(async () => ({
    id: "analysis-1",
    hash: ("0x" + "ab".repeat(32)) as `0x${string}`,
    fileName: "msa.txt",
    analysis: {
      title: "MSA",
      contractType: "Services",
      summary: "Summary",
      parties: ["A", "B"],
      paymentTerms: ["Net 30"],
      keyDates: ["2026-01-01"],
      obligations: ["Deliver"],
      risks: [],
      missingClauses: [],
      healthScore: 80,
      recommendations: ["Review"],
    },
    extractedText: "secret",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  })),
  toPublicAnalysis: (item: { extractedText?: string }) => {
    const { extractedText: _e, ...rest } = item;
    return rest;
  },
}));

vi.mock("@/lib/session", () => ({
  hasAnalysisAccess: vi.fn(async () => true),
  getSessionToken: vi.fn(async () => "session-token"),
}));

vi.mock("@/lib/blockchain", () => ({
  storeManagedProof: vi.fn(async () => ({
    proof: {
      hash: "0x" + "ab".repeat(32),
      owner: "0x1111111111111111111111111111111111111111",
      timestamp: 1700000000,
      transactionHash: "0x" + "cd".repeat(32),
    },
    alreadySecured: false,
  })),
  getProof: vi.fn(async () => null),
  explorerBase: () => "https://testnet.monadexplorer.com",
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn(async () => ({ ok: true, skipped: true })),
}));

describe("POST /api/proofs/managed", () => {
  it("returns a managed proof for an authorized session", async () => {
    const { POST } = await import("@/app/api/proofs/managed/route");
    const request = new NextRequest("http://localhost/api/proofs/managed", {
      method: "POST",
      body: JSON.stringify({ id: "analysis-1", turnstileToken: "token" }),
      headers: { "content-type": "application/json" },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.proof.transactionHash).toMatch(/^0x/);
  });
});
