import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { getAnalysis } from "@/lib/store";
import { hasAnalysisAccess } from "@/lib/session";
import { explorerBase, getProof } from "@/lib/blockchain";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await hasAnalysisAccess(id))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const item = await getAnalysis(id);
  if (!item) return new NextResponse("Analysis expired", { status: 404 });

  const proof = await getProof(item.hash);
  const explorer = explorerBase();
  const pdf = new jsPDF();
  let y = 22;

  const ensureSpace = (needed = 24) => {
    if (y + needed > 280) {
      pdf.addPage();
      y = 20;
    }
  };

  const heading = (text: string) => {
    ensureSpace(16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(16, 35, 33);
    pdf.text(text, 18, y);
    y += 8;
  };

  const body = (text: string) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(70, 90, 86);
    const lines = pdf.splitTextToSize(text || "—", 174);
    ensureSpace(lines.length * 5 + 8);
    pdf.text(lines, 18, y);
    y += lines.length * 5 + 8;
  };

  const bullets = (items: string[]) => {
    if (!items.length) {
      body("None listed.");
      return;
    }
    body(items.map((item) => `• ${item}`).join("\n"));
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(18, 58, 49);
  pdf.text("Provenn AI", 18, y);
  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(102, 128, 123);
  pdf.text("Contract intelligence report", 18, y);
  y += 6;
  pdf.text(`Generated ${new Date().toLocaleString()}`, 18, y);
  y += 12;

  heading("Contract");
  body(`${item.analysis.title} · ${item.analysis.contractType}`);
  body(`File: ${item.fileName}`);

  heading("Health score");
  body(`${item.analysis.healthScore}/100`);

  heading("Summary");
  body(item.analysis.summary);

  heading("Parties");
  bullets(item.analysis.parties);

  heading("Payment terms");
  bullets(item.analysis.paymentTerms);

  heading("Key dates");
  bullets(item.analysis.keyDates);

  heading("Obligations");
  bullets(item.analysis.obligations);

  heading("Risks");
  if (!item.analysis.risks.length) body("No notable risks identified.");
  else {
    for (const risk of item.analysis.risks) {
      body(
        `${risk.title} [${risk.severity.toUpperCase()}] (${risk.sectionReference})\n"${risk.quotedClause}"\nWhy it matters: ${risk.whyItMatters}\nRecommendation: ${risk.recommendation}`,
      );
    }
  }

  heading("Missing clauses");
  bullets(item.analysis.missingClauses);

  heading("Recommendations");
  bullets(item.analysis.recommendations);

  heading("Document hash");
  body(item.hash);

  heading("Proof");
  if (proof) {
    body(
      `Secured ${new Date(proof.timestamp * 1000).toLocaleString()} by ${proof.owner}.`,
    );
    body(
      proof.transactionHash
        ? `Transaction: ${proof.transactionHash}\nExplorer: ${explorer}/tx/${proof.transactionHash}`
        : "Transaction indexing.",
    );
  } else {
    body("Not yet secured on Monad.");
  }

  return new NextResponse(Buffer.from(pdf.output("arraybuffer")), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="provenn-report-${item.id.slice(0, 8)}.pdf"`,
    },
  });
}
