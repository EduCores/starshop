import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const search = new URL(req.url).searchParams;

    // MercadoPago envía notificaciones con type/topic y data.id o resource
    console.log("[MercadoPago webhook] headers origin:", req.headers.get("origin"));
    console.log("[MercadoPago webhook] query:", Object.fromEntries(search.entries()));
    console.log("[MercadoPago webhook] body:", JSON.stringify(body).slice(0, 4000));

    // Aquí validarías el pago con la API de MP (Payment.findById) usando el access_token.
    // Por ahora solo acuse de recibo 200 para no reintentar.
    // Ej:
    // const paymentId = body?.data?.id || search.get("data.id");
    // if (paymentId) { const payment = await new Payment(client).get({ id: paymentId }); ... actualizar orden ... }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error en webhook MercadoPago";
    console.error("[MercadoPago webhook] ", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "MercadoPago webhook activo. Use POST." });
}
