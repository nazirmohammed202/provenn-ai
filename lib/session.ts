import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
const COOKIE = "provenn_analysis";
function sign(id: string) { return createHmac("sha256", process.env.COOKIE_SECRET || "local-development-secret").update(id).digest("hex"); }
export async function setAnalysisCookie(id: string) { const jar = await cookies(); jar.set(COOKIE, `${id}.${sign(id)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" }); }
export async function hasAnalysisAccess(id: string) { const value = (await cookies()).get(COOKIE)?.value; if (!value) return false; const [stored, signature] = value.split("."); if (!stored || !signature) return false; return stored === id && timingSafeEqual(Buffer.from(signature), Buffer.from(sign(id))); }
