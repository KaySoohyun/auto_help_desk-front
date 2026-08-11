import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const streamSchema = z.object({
  text: z.string().trim().min(1).max(3000),
});

export async function POST(req: NextRequest) {

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = streamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Texto inválido o demasiado largo." }, { status: 422 });
  }

  // SSE response
  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        // Simulación: dividir texto en "tokens" y enviarlos con retardo
        const tokens = parsed.data.text.split(" ");
        for (const token of tokens) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          controller.enqueue(`data: {"token": "${token}"}\n\n`);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  const response: NextResponse<string> = new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  return response;
}