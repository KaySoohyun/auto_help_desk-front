import { NextResponse } from "next/server";
import { z } from "zod";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/cookies";
import type { TokenResponse, UserOut } from "@/types/auth.types";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresá tu email.").email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const tokens = await fastApiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    const user = await fastApiFetch<UserOut>("/auth/me", { token: tokens.access_token });

    await setAuthCookies(tokens.access_token, tokens.expires_in, tokens.refresh_token);

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
      }
      if (err.status === 403) {
        return NextResponse.json({ error: "Tu cuenta está inactiva." }, { status: 403 });
      }
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
