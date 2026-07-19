import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decryptJson, encryptJson } from "./crypto";

const COOKIE = "provenn_session";
const TTL_SECONDS = 60 * 60 * 24;

type SessionPayload = {
  analysisId: string;
  exp: number;
};

function secret() {
  return process.env.COOKIE_SECRET || "local-development-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_SECONDS,
    path: "/",
  };
}

export function createAnalysisSessionValue(analysisId: string) {
  const payload = encryptJson<SessionPayload>({
    analysisId,
    exp: Date.now() + TTL_SECONDS * 1000,
  });
  return `${payload}.${sign(payload)}`;
}

function readPayload(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const payload = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = decryptJson<SessionPayload>(payload);
    if (!data.analysisId || data.exp <= Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function attachAnalysisCookie(
  response: NextResponse,
  analysisId: string,
) {
  response.cookies.set(
    COOKIE,
    createAnalysisSessionValue(analysisId),
    cookieOptions(),
  );
  return response;
}

export async function setAnalysisCookie(analysisId: string) {
  const jar = await cookies();
  jar.set(COOKIE, createAnalysisSessionValue(analysisId), cookieOptions());
}

export async function getSessionAnalysisId() {
  const value = (await cookies()).get(COOKIE)?.value;
  return readPayload(value)?.analysisId || null;
}

export async function hasAnalysisAccess(id: string) {
  const analysisId = await getSessionAnalysisId();
  return analysisId === id;
}

export async function getSessionToken() {
  const value = (await cookies()).get(COOKIE)?.value;
  const payload = readPayload(value);
  return payload ? sign(payload.analysisId) : null;
}
