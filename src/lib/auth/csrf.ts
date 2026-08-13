import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { CSRF_TOKEN_COOKIE } from "@/lib/auth/constants";

export const CSRF_HEADER = "x-csrf-token";

export async function getCsrfToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CSRF_TOKEN_COOKIE)?.value;
}

export async function setCsrfCookie(token: string = crypto.randomUUID()): Promise<string> {
  const store = await cookies();
  store.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return token;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function verifyCsrf(req: NextRequest | undefined): Promise<boolean> {
  const cookieToken = await getCsrfToken();
  if (!cookieToken) return false;
  const headerToken = req?.headers.get(CSRF_HEADER);
  if (!headerToken) return false;
  return safeEqual(cookieToken, headerToken);
}
