export function mapServiceError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const message = error.message || fallback;

  if (/GEMINI_API_KEY|AI analysis is not configured/i.test(message))
    return "AI analysis is not configured.";
  if (/Managed Monad proof is not configured/i.test(message))
    return "Managed Monad proof is not configured.";
  if (/quota|rate limit|429/i.test(message))
    return "Upstream rate limit reached. Please retry shortly.";
  if (/network|fetch failed|ECONNREFUSED|timeout/i.test(message))
    return "Network error while contacting an upstream service.";
  if (/ZodError|invalid_type|JSON/i.test(message))
    return "The AI returned an invalid analysis. Please retry.";
  if (/insufficient funds|gas/i.test(message))
    return "The managed wallet cannot pay gas on Monad.";
  if (/Proof already exists/i.test(message))
    return "This document hash is already secured on Monad.";

  return message.length > 180 ? fallback : message;
}
