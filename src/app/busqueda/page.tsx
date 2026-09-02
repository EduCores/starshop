import type { Metadata } from "next";
import { SearchResultsView } from "@/components/modules/SearchResultsView";
import { searchProductsGeneric, matchCategories } from "@/lib/search";

// Búsqueda genérica: /busqueda?q=taladro -> ventana con TODOS los taladros del catálogo
// (independiente de la página de categoría /categoria/[slug])

type Props = { searchParams?: { q?: string } };

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = (searchParams?.q ?? "").trim();
  const title = q ? `Resultados para "${q}" | Starshop` : "Buscador | Starshop";
  const description = q
    ? `Encuentra ${q} y todo en herramientas, iluminación LED e instrumentos de medición en Starshop Chile. Despacho 24h RM y productos certificados SEC.`
    : "Busca en todo el catálogo Starshop Chile: herramientas, iluminación LED, medición, seguridad y energía.";
  return {
    title,
    description,
    robots: { index: false, follow: true },
  };
}

export default function BusquedaPage({ searchParams }: Props) {
  const q = (searchParams?.q ?? "").trim();
  const results = searchProductsGeneric(q).map((r) => r.product);
  const categories = matchCategories(q);

  return <SearchResultsView query={q} results={results} categories={categories} />;
}