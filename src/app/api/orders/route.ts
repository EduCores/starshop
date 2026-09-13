import { NextRequest, NextResponse } from "next/server";
import { saveOrder, getAllOrders, findOrderById } from "@/lib/orders";
import type { Order } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/orders — persiste una orden en data/orders.json.
 * Se llama desde el checkout antes de redirigir a la pasarela, para que
 * la orden sobreviva al retorno de Webpay/MercadoPago (ya no depende solo
 * de sessionStorage).
 */
export async function POST(req: NextRequest) {
  try {
    const order = await req.json();
    if (!order?.orderId || !Array.isArray(order.items) || typeof order.grandTotal !== "number") {
      return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
    }
    const stored = saveOrder(order as Order);
    return NextResponse.json({ ok: true, orderId: stored.orderId, status: stored.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error guardando la orden";
    console.error("[orders POST] ", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/orders?orderId=ORD-12345 — consulta una orden puntual.
 * Sin orderId solo devuelve el total (no expone datos de clientes).
 */
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get("orderId");
  if (orderId) {
    const order = findOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    return NextResponse.json({ order });
  }
  return NextResponse.json({ total: getAllOrders().length });
}
