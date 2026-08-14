import { NextResponse } from "next/server";
import { z } from "zod";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/cookies";
import type { TokenResponse, UserOut } from "@/types/auth.types";

const registerSchema = z.object({
  email: z.string().trim().min(1, "Ingresá tu email.").email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  tenant_ids: z.array(z.string().trim().min(1)).max(20).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 422 }
    );
  }

  const { email, password, tenant_ids } = parsed.data;

  try {
    const registerPayload: { email: string; password: string; role: "agent"; tenant_ids: string[] } = {
      email,
      password,
      role: "agent",
      tenant_ids: tenant_ids ?? [],
    };

    await fastApiFetch<UserOut>("/auth/register", {
      method: "POST",
      body: registerPayload,
    });

    // Auto-login: emitir tokens para la sesión recién creada.
    const tokens = await fastApiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const user = await fastApiFetch<UserOut>("/auth/me", { token: tokens.access_token });

    await setAuthCookies(tokens.access_token, tokens.expires_in, tokens.refresh_token);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 });
      }
      if (err.status === 404) {
        return NextResponse.json({ error: "Uno de los tenants seleccionados no existe." }, { status: 404 });
      }
      if (err.status === 422) {
        return NextResponse.json({ error: err.message || "Datos de registro inválidos." }, { status: 422 });
      }
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
