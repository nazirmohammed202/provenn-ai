import { NextResponse } from "next/server";
import { hashDocument } from "@/lib/hash";
import { explorerBase, getProof } from "@/lib/blockchain";
import { validateUploadMeta } from "@/lib/parser";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required" }, { status: 400 });
    }

    validateUploadMeta(file);
    const hash = hashDocument(await file.arrayBuffer());
    const proof = await getProof(hash);
    const explorer = explorerBase();

    return NextResponse.json({
      hash,
      verified: Boolean(proof),
      status: proof ? "verified" : "modified_or_unknown",
      proof: proof
        ? {
            ...proof,
            explorerTxUrl: proof.transactionHash
              ? `${explorer}/tx/${proof.transactionHash}`
              : null,
            explorerAddressUrl: `${explorer}/address/${proof.owner}`,
          }
        : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed." },
      { status: 400 },
    );
  }
}
