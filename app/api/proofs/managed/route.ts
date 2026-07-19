import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/store";
import { getSessionToken, hasAnalysisAccess } from "@/lib/session";
import { storeManagedProof } from "@/lib/blockchain";
import { verifyTurnstile } from "@/lib/turnstile";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { mapServiceError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const { id, turnstileToken } = await request.json();
    if (!id || !(await hasAnalysisAccess(id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = clientIp(request);
    const session = (await getSessionToken()) || "anon";
    const ipLimit = rateLimit(`proof-ip:${ip}`, 10);
    const sessionLimit = rateLimit(`proof-session:${session}`, 5);
    if (!ipLimit.ok || !sessionLimit.ok) {
      return NextResponse.json(
        { error: "Rate limit reached." },
        { status: 429 },
      );
    }

    const challenge = await verifyTurnstile(turnstileToken, ip);
    if (!challenge.ok) {
      return NextResponse.json({ error: challenge.error }, { status: 400 });
    }

    const item = await getAnalysis(id);
    if (!item) {
      return NextResponse.json({ error: "Analysis expired." }, { status: 404 });
    }

    const result = await storeManagedProof(item.hash);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: mapServiceError(e, "Unable to secure proof.") },
      { status: 500 },
    );
  }
}
