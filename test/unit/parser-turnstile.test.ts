import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => null },
}));

describe("parser validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejects unsupported extensions", async () => {
    const { validateUploadMeta } = await import("@/lib/parser");
    expect(() =>
      validateUploadMeta(
        new File(["hi"], "notes.csv", { type: "text/csv" }),
      ),
    ).toThrow(/PDF, DOCX/);
  });

  it("rejects oversized files", async () => {
    const { validateUploadMeta } = await import("@/lib/parser");
    const big = new File([new Uint8Array(16 * 1024 * 1024)], "a.pdf", {
      type: "application/pdf",
    });
    expect(() => validateUploadMeta(big)).toThrow(/15 MB/);
  });
});

describe("turnstile", () => {
  it("skips when secret is unset", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile(undefined)).resolves.toMatchObject({
      ok: true,
      skipped: true,
    });
  });

  it("requires a token when configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.resetModules();
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile(undefined)).resolves.toMatchObject({
      ok: false,
    });
  });
});
