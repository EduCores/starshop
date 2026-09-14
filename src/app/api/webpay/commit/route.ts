import { NextRequest, NextResponse } from "next/server";
import { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from "transbank-sdk";
import { db } from "@/data";
import type { OrderStatus } from "@/data";

function getWebpayOptions() {
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
  const apiKey = process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;
  const env = process.env.WEBPAY_ENV === "production" ? Environment.Production : Environment.Integration;
  return new Options(commerceCode, apiKey, env);
}

interface WebpayCommitResponse {
  status?: string;
  response_code?: number;
  buy_order?: string;
}

function statusFromCommit(commitResponse: WebpayCommitResponse): OrderStatus {
  const authorized = commitResponse?.status === "AUTHORIZED";
  if (authorized && commitResponse?.response_code === 0) return "approved";
  if (commitResponse?.status === "REJECTED" || authorized) return "rejected";
  return "failed";
}

// Confirma la transacción y sincroniza el estado de la orden persistida.
// La actualización de la orden es best-effort: nunca rompe la respuesta del commit.
async function commitAndSync(token: string): Promise<WebpayCommitResponse> {
  const options = getWebpayOptions();
  const tx = new WebpayPlus.Transaction(options);
  const commitResponse = (await tx.commit(token)) as WebpayCommitResponse;
  try {
    const ref = commitResponse?.buy_order;
    if (ref) {
      const order = await db.orders.findByExternalRef(ref);
      if (order) await db.orders.updateStatus(order.orderId, statusFromCommit(commitResponse));
    }
  } catch (e) {
    console.warn("[WebPay commit] no se pudo actualizar la orden:", e);
  }
  return commitResponse;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body.token_ws || body.tokenWs || body.token || new URL(req.url).searchParams.get("token_ws");

    if (!token) {
      return NextResponse.json({ error: "Falta token_ws" }, { status: 400 });
    }

    const commitResponse = await commitAndSync(token);
    return NextResponse.json(commitResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error confirmando transacción Webpay";
    console.error("[WebPay commit] ", msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Soporta también GET ?token_ws=... (redirige Transbank hace GET)
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token_ws");
  if (!token) return NextResponse.json({ error: "Falta token_ws" }, { status: 400 });

  try {
    const commitResponse = await commitAndSync(token);
    return NextResponse.json(commitResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error confirmando Webpay (GET)";
    console.error("[WebPay commit GET] ", msg, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
