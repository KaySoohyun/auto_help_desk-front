import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

/** Extrae el rol del JWT (payload base64url, sin verificar firma: solo ruteo). */
function getRoleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      decodeURIComponent(escape(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))))
    );
    const roles = Array.isArray(payload?.roles) ? payload.roles : [];
    return typeof roles[0] === "string" ? roles[0] : null;
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const hasSession = Boolean(accessToken);
  const role = getRoleFromToken(accessToken);

  if (pathname.startsWith("/app") || pathname.startsWith("/panel")) {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.startsWith("/panel") ? "/personas/login" : "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/login" || pathname === "/empresas/login" || pathname === "/personas/login") {
    if (hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = role === "customer" ? "/panel" : "/app";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Landing page - siempre accesible
  if (pathname === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/app/:path*", "/panel/:path*", "/login", "/empresas/login", "/personas/login"],
};
