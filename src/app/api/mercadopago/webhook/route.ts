import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { db } from "@/data";
import type { OrderStatus } from "@/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mpStatusToOrderStatus(status: string | undefined): OrderStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "pending":
    case "in_process":
    case "authorized":
      return "pending";
    case "rejected":
    case "cancelled":
      return "rejected";
    default:
      return "failed";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const search = new URL(req.url).searchParams;
    const paymentId = body?.data?.id || search.get("data.id") || search.get("id");
    const topic = body?.type || body?.topic || search.get("type") || search.get("topic");

    // MercadoPago envía notificaciones de varios tipos (payment, merchant_order...).
    // Solo procesamos "payment": consultamos el pago real con la API usando el
    // access token (nunca confiamos en el body del webhook, que podría falsificarse).
    if (topic && topic !== "payment") {
      return NextResponse.json({ received: true, ignored: topic });
    }

    if (paymentId && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      const payment = new Payment(client);
      const p = await payment.get({ id: String(paymentId) });

      console.log(
        `[MercadoPago webhook] payment ${paymentId} status=${p.status} ref=${p.external_reference ?? "-"}`
      );

      const ref = p.external_reference;
      if (ref) {
        const order = await db.orders.findByExternalRef(ref);
        if (order) await db.orders.updateStatus(order.orderId, mpStatusToOrderStatus(p.status));
      }
    } else {
      // Sin access token (modo integración local): solo acuse de recibo.
      console.log(`[MercadoPago webhook] recibido payment=${paymentId ?? "-"} (sin token para validar)`);
    }

    // Siempre 200 para que MP no reintente indefinidamente.
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error en webhook MercadoPago";
    console.error("[MercadoPago webhook] ", msg);
    return NextResponse.json({ received: true, warning: msg });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "MercadoPago webhook activo. Use POST." });
}
