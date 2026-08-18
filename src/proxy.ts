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

  // Rutas legacy (pre-slug): redirigir a la landing para elegir empresa.
  if (
    pathname === "/app" ||
    pathname === "/panel" ||
    pathname === "/login" ||
    pathname === "/personas/login" ||
    pathname === "/empresas/login" ||
    pathname.startsWith("/app/") ||
    pathname.startsWith("/panel/")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Landing: siempre accesible.
  if (pathname === "/") {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[0];
  const sub = segments[1];

  // Rutas con slug: /:slug/... Si el slug y el sub están bien formados, proseguir.
  if (slug && (sub === "app" || sub === "panel" || sub === "personas" || sub === "empresas")) {
    if (pathname.startsWith(`/${slug}/app`)) {
      if (!hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = `/${slug}/empresas/login`;
        url.search = "";
        return NextResponse.redirect(url);
      }
      // El portal de agentes es exclusivo de roles de soporte (no customer).
      if (role === "customer") {
        const url = req.nextUrl.clone();
        url.pathname = `/${slug}/panel`;
        url.search = "";
        return NextResponse.redirect(url);
      }
      // La home de la app va directo a los tickets.
      if (pathname === `/${slug}/app`) {
        const url = req.nextUrl.clone();
        url.pathname = `/${slug}/app/tickets`;
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    if (pathname.startsWith(`/${slug}/panel`)) {
      if (!hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = `/${slug}/personas/login`;
        url.search = "";
        return NextResponse.redirect(url);
      }
      // El portal de personas es exclusivo del rol customer.
      if (role !== "customer") {
        const url = req.nextUrl.clone();
        url.pathname = `/${slug}/app`;
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    // Logins con slug: si ya hay sesión, ir a la home del rol.
    if (pathname === `/${slug}/personas/login` || pathname === `/${slug}/empresas/login`) {
      if (hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = `/${slug}/${role === "customer" ? "panel" : "app"}`;
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/app",
    "/panel",
    "/login",
    "/personas/login",
    "/empresas/login",
    "/app/:path*",
    "/panel/:path*",
    "/:slug/personas/login",
    "/:slug/empresas/login",
    "/:slug/app/:path*",
    "/:slug/panel/:path*",
  ],
};
