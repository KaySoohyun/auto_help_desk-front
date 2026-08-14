import { NextResponse } from "next/server";
import { fastApiFetch } from "@/lib/api/fastapi";

interface Category {
  value: string;
  label: string;
}

export async function GET() {
  try {
    const categories = await fastApiFetch<Category[]>("/v1/tickets/categories", {
      method: "GET",
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "No se pudieron obtener las categorías." }, { status: 500 });
  }
}
