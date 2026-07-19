import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractText } from "@/lib/parser";
import { hashDocument } from "@/lib/hash";
import { analyzeContract } from "@/lib/ai";
import { getProof } from "@/lib/blockchain";
import { saveAnalysis, toPublicAnalysis } from "@/lib/store";
import { attachAnalysisCookie } from "@/lib/session";
import { mapServiceError } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`analyze:${ip}`, 20);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again later." },
        { status: 429 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A contract file is required." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const text = await extractText(file);
    const id = randomUUID();
    const createdAt = new Date();
    const hash = hashDocument(bytes);
    const record = {
      id,
      hash,
      fileName: file.name,
      analysis: await analyzeContract(text),
      extractedText: text,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };

    await saveAnalysis(record);
    const response = NextResponse.json({
      ...toPublicAnalysis(record),
      proof: await getProof(hash),
    });
    return attachAnalysisCookie(response, id);
  } catch (e) {
    return NextResponse.json(
      { error: mapServiceError(e, "Analysis failed.") },
      { status: 422 },
    );
  }
}
