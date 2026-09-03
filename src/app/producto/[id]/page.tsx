import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products, superCategories } from "@/lib/mock-data";
import { ProductDetail } from "@/components/modules/ProductDetail";
import { SuggestedProducts } from "@/components/modules/SuggestedProducts";
import { JsonLd } from "@/components/seo/JsonLd";
import { ChevronRight } from "lucide-react";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

// Resuelve el producto por id, SKU o slug (el agente ACS enlaza con /producto/<sku>)
function findProduct(id: string) {
  const key = decodeURIComponent(id).toLowerCase();
  return products.find((p) => p.id === id || p.sku.toLowerCase() === key || p.slug === key);
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const product = findProduct(params.id);
  const title = product ? `${product.name} | Starshop` : "Producto | Starshop";
  const description = product?.shortDescription ?? "Ficha técnica, precio y despacho. Producto demo (mockup) — no es oferta real.";
  const url = `https://starshop.cl/producto/${params.id}`;
  const img = product?.images[0];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: img ? [{ url: img, width: 800, height: 800, alt: product?.name ?? "Producto" }] : [{ url: "/og-starshop.jpg", width: 1200, height: 630, alt: "Starshop" }],
    },
  };
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = findProduct(params.id);
  if (!product) notFound();

  const category = superCategories.find((c) => c.id === product.categoryId);

  // Sugeridos: misma categoría primero, luego resto; excluye el actual
  const suggestions = [
    ...products.filter((p) => p.id !== product.id && p.categoryId === product.categoryId),
    ...products.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId),
  ].slice(0, 10);

  return (
    <div className="pb-10">
      <JsonLd product={product} category={category} />

      {/* Breadcrumb */}
      <section className="mt-6">
        <div className="container">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 flex-wrap">
            <Link href="/" className="hover:text-[#FF3B30] hover:underline">Inicio</Link>
            <ChevronRight className="h-3 w-3 text-zinc-400" />
            <span>{category?.name ?? "Catálogo"}</span>
            <ChevronRight className="h-3 w-3 text-zinc-400" />
            <span className="text-zinc-800 dark:text-zinc-200 font-medium line-clamp-2">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Ficha de producto (PDP) */}
      <ProductDetail product={product} />

      {/* Fila de 4 productos sugeridos con slide automático hacia la derecha */}
      <SuggestedProducts products={suggestions} />
    </div>
  );
}
