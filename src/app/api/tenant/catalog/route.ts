import { NextRequest, NextResponse } from "next/server";
import { db } from "@/data";
import type { Product } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tenant/catalog — el PUENTE entre StarShop y el cerebro (ACS).
 * Sirve el catálogo VIVO del tenant (con stock por sucursal cuando el
 * provider es supabase, vía la vista catalog_with_stock).
 *
 *   GET /api/tenant/catalog
 *   GET /api/tenant/catalog?tenant=<slug o id>   (per-deploy sirve el suyo)
 *
 * ACS usa esta URL con su `storeId` para el sync idempotente
 * (ver docs/SYNC-CONTRACTO.md): misma idea que /api/store/products pero
 * orientada al tenant y lista para multi-cliente.
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = new URL(req.url).searchParams.get("tenant")
      ?? process.env.STARSHOP_TENANT_ID
      ?? "local";
    const products = await db.catalog.list({ tenantId: tenant });
    const branch = new URL(req.url).searchParams.get("branch");

    return NextResponse.json({
      tenantId: tenant,
      provider: db.name,
      syncedAt: new Date().toISOString(),
      currency: "CLP",
      branch,
      total: products.length,
      products: products.map((p: Product) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        originalPrice: p.originalPrice ?? null,
        discount: p.discount ?? null,
        stock: p.stock,
        images: p.images,
        category: p.categoryId,
        subcategory: p.subcategory,
        brand: p.brand,
        secCertified: p.secCertified,
        warranty: p.warranty,
        isB2B: p.isB2B,
        tierPrices: p.tierPrices,
        tags: p.tags,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error leyendo el catálogo del tenant";
    console.error("[tenant/catalog] ", msg);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}