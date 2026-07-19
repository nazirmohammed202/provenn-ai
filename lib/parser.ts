import mammoth from "mammoth";

const MAX_TEXT = 100_000;
export async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase(); let text = "";
  if (name.endsWith(".txt")) text = buffer.toString("utf8");
  else if (name.endsWith(".docx")) text = (await mammoth.extractRawText({ buffer })).value;
  else if (name.endsWith(".pdf")) { const pdf = (await import("pdf-parse")).default; text = (await pdf(buffer)).text; }
  else throw new Error("Please upload a PDF, DOCX, or plain text contract.");
  text = text.replace(/\0/g, "").trim();
  if (!text) throw new Error("We couldn't find readable text in this document.");
  if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT);
  return text;
}
