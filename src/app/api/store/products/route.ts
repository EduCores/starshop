import { NextRequest, NextResponse } from "next/server";
import { db } from "@/data";
import type { Product } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/store/products — catálogo para sincronización externa (admin ACS).
 * Ahora lee del PROVIDER multi-tenant (DATA_PROVIDER=local -> mock-data;
 * DATA_PROVIDER=supabase -> catálogo real del tenant). Misma forma que antes
 * para no romper el sync del cerebro (ACS), incluidos los campos extra
 * (secCertified, discount, url, source -> source es ahora el provider).
 */
export async function GET(_req: NextRequest) {
  try {
    const tenantId = process.env.STARSHOP_TENANT_ID ?? "local";
    const products = await db.catalog.list({ tenantId });

    return NextResponse.json({
      store: tenantId,
      currency: "CLP",
      syncedAt: new Date().toISOString(),
      total: products.length,
      products: products.map((p: Product) => ({
        externalId: p.id,
        sku: p.sku,
        title: p.name,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        compareAtPrice: p.originalPrice ?? null,
        currency: "CLP",
        stock: p.stock,
        images: p.images,
        category: p.categoryId,
        subcategory: p.subcategory,
        brand: p.brand,
        secCertified: p.secCertified,
        discount: p.discount ?? null,
        url: `/producto/${p.id}`,
      })),
      source: db.name,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error leyendo el catálogo";
    console.error("[store/products] ", msg);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
