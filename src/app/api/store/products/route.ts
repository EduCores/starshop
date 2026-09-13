import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/store/products — catálogo para sincronización externa (admin ACS).
 * Intenta DB primero, si no hay DB (Vercel SQLite efímero) usa mock-data para no romper el sync.
 */
export async function GET(req: NextRequest) {
  try {
    const { getProducts } = await import("@/lib/catalog");
    const products = await getProducts();
    if (products.length > 0) {
      return NextResponse.json({
        store: "starshop",
        currency: "CLP",
        syncedAt: new Date().toISOString(),
        total: products.length,
        products: products.map((p) => ({
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
      });
    }
  } catch (e) {
    console.warn("[store/products] DB no disponible, usando mock-data:", (e as Error).message?.slice(0,120));
  }
  // Fallback a mock-data (siempre disponible, no necesita DB)
  const { products } = await import("@/lib/mock-data");
  return NextResponse.json({
    store: "starshop",
    currency: "CLP",
    syncedAt: new Date().toISOString(),
    total: products.length,
    products: products.map((p) => ({
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
