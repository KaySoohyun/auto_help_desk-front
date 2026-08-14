import { NextResponse } from "next/server";
import { z } from "zod";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import { setAuthCookies, getAccessToken } from "@/lib/auth/cookies";
import type { TokenResponse, UserOut } from "@/types/auth.types";

const switchTenantSchema = z.object({
  tenant_id: z.string().trim().min(1, "Seleccioná un tenant."),
});

export async function POST(req: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = switchTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 422 }
    );
  }

  const { tenant_id } = parsed.data;

  try {
    const tokens = await fastApiFetch<TokenResponse>("/auth/switch-tenant", {
      method: "POST",
      body: { tenant_id },
      token: accessToken,
    });

    const user = await fastApiFetch<UserOut>("/auth/me", { token: tokens.access_token });

    await setAuthCookies(tokens.access_token, tokens.expires_in, tokens.refresh_token);

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
      }
      if (err.status === 403) {
        return NextResponse.json({ error: "No tenés acceso a este tenant." }, { status: 403 });
      }
      if (err.status === 404) {
        return NextResponse.json({ error: "Tenant no encontrado." }, { status: 404 });
      }
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
