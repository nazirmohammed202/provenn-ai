const MAX_TEXT = 100_000;
const MIN_TEXT = 40;

const ALLOWED_EXT = new Set([".pdf", ".docx", ".txt"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/octet-stream",
  "",
]);

function extension(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

const PDF_READ_ERROR =
  "This PDF could not be read. Re-export it from your editor or try uploading a DOCX or TXT copy instead.";

function pdfReadError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/password|encrypted|needs password/i.test(message)) {
    return new Error(
      "This PDF is password-protected. Remove the password and upload again.",
    );
  }
  if (/bad XRef|InvalidPDF|corrupt|malformed|xref/i.test(message)) {
    return new Error(PDF_READ_ERROR);
  }
  return new Error(PDF_READ_ERROR);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const data = new Uint8Array(buffer);

  try {
    const pdf = await getDocumentProxy(data, { stopAtErrors: false });
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n\n") : text;
  } catch (error) {
    throw pdfReadError(error);
  }
}

export function validateUploadMeta(file: File) {
  const ext = extension(file.name);
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("Please upload a PDF, DOCX, or plain text contract.");
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Files must be under 15 MB.");
  }
}

export async function extractText(file: File): Promise<string> {
  validateUploadMeta(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extension(file.name);
  let text = "";

  if (ext === ".txt") text = buffer.toString("utf8");
  else if (ext === ".docx") {
    const mammoth = await import("mammoth");
    text = (await mammoth.extractRawText({ buffer })).value;
  } else if (ext === ".pdf") {
    text = await extractPdfText(buffer);
  } else {
    throw new Error("Please upload a PDF, DOCX, or plain text contract.");
  }

  text = text.replace(/\0/g, "").trim();
  if (!text) {
    throw new Error("We couldn't find readable text in this document.");
  }
  if (text.length < MIN_TEXT) {
    throw new Error("Extracted text is too short to analyze reliably.");
  }
  if (text.length > MAX_TEXT) {
    throw new Error(
      `Extracted text exceeds the ${MAX_TEXT.toLocaleString()} character limit.`,
    );
  }
  return text;
}
