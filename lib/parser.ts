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
    const pdf = (await import("pdf-parse")).default;
    text = (await pdf(buffer)).text;
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
