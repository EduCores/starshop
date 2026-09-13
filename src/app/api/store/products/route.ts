import { NextRequest, NextResponse } from "next/server";
import { products as mockProducts } from "../../../../lib/mock-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/store/products — catálogo para sincronización externa (admin ACS).
 * En f4bfddd StarShop usa mock-data (no DB). Devuelve mock-data directo para que ACS pueda sincronizar sin depender de SQLite en Vercel.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    store: "starshop",
    currency: "CLP",
    syncedAt: new Date().toISOString(),
    total: mockProducts.length,
    products: mockProducts.map((p: any) => ({
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
    source: "mock-fallback",
  });
}
