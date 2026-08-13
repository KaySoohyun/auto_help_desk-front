import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./constants";
import { setCsrfCookie } from "./csrf";

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function setAuthCookies(
  accessToken: string,
  expiresInSeconds: number,
  refreshToken: string
): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresInSeconds,
  });
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
  await setCsrfCookie();
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}
