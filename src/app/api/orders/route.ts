import { NextRequest, NextResponse } from "next/server";
import { db } from "@/data";
import type { Order } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/orders — persiste una orden en el provider activo
 * (DATA_PROVIDER=local -> data/orders.json; supabase -> tabla orders).
 * Se llama desde el checkout antes de redirigir a la pasarela.
 */
export async function POST(req: NextRequest) {
  try {
    const order = await req.json();
    if (!order?.orderId || !Array.isArray(order.items) || typeof order.grandTotal !== "number") {
      return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
    }
    const stored = await db.orders.save(order as Order);
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
    const order = await db.orders.findById(orderId);
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    return NextResponse.json({ order });
  }
  return NextResponse.json({ total: await db.orders.count() });
}
