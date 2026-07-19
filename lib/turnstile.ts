import "server-only";

export async function verifyTurnstile(token: string | undefined, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true as const, skipped: true as const };
  if (!token)
    return {
      ok: false as const,
      error: "Complete the verification challenge.",
    };

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip && ip !== "local") body.set("remoteip", ip);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  const data = (await response.json()) as { success?: boolean };
  if (!data.success)
    return {
      ok: false as const,
      error: "Verification challenge failed. Try again.",
    };
  return { ok: true as const, skipped: false as const };
}
