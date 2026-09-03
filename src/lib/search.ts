import { products, superCategories } from "@/lib/mock-data";
import type { Product, SuperCategory } from "@/types";

/**
 * Búsqueda genérica de catálogo: busca un término libre (ej: "taladro")
 * en TODO el catálogo (nombre, SKU, descripción, marca, subcategoría y tags),
 * sin quedar limitado a una sola categoría.
 */

export interface SearchResult {
  product: Product;
  score: number;
}

// Normaliza: minúsculas y sin acentos, para que "multimetro" matchee "multímetro"
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Singulariza simple: "taladros" -> "taladro", "prensas" -> "prensa"
function stems(token: string): string[] {
  const list = [token];
  if (token.endsWith("es") && token.length > 4) list.push(token.slice(0, -2));
  if (token.endsWith("s") && token.length > 3) list.push(token.slice(0, -1));
  return list;
}

export function scoreProductForQuery(p: Product, query: string): number {
  const q = normalize(query).trim();
  if (!q) return 0;
  const tokens = q.split(/\s+/).filter(Boolean);

  const name = normalize(p.name);
  const sku = normalize(p.sku);
  const brand = normalize(p.brand);
  const tags = normalize((p.tags ?? []).join(" "));
  const subcategory = normalize(p.subcategory);
  const body = normalize([p.description, p.shortDescription].join(" "));

  let score = 0;
  for (const raw of tokens) {
    for (const t of stems(raw)) {
      if (sku.includes(t)) score += 6;
      if (name.includes(t)) score += 5;
      if (tags.includes(t)) score += 3;
      if (subcategory.includes(t)) score += 2;
      if (brand.includes(t)) score += 2;
      if (body.includes(t)) score += 1;
    }
  }
  return score;
}

export function searchProductsGeneric(query: string, limit?: number): SearchResult[] {
  const qn = normalize(query).trim();

  // Colecciones especiales: "ofertas" y "destacados" no son búsquedas de texto,
  // son filtros categóricos del catálogo.
  if (/^(ofertas?|descuentos?|promos?|promociones?|remates?|cyber(day)?|sale|liquidacion(es)?|ofertas flash)$/.test(qn)) {
    const ofertas = products
      .filter((p) => (p.originalPrice && p.originalPrice > p.price) || p.isFlashSale)
      .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0) || b.soldCount - a.soldCount);
    return (limit ? ofertas.slice(0, limit) : ofertas).map((product) => ({ product, score: 100 }));
  }
  if (/^(destacados?|recomendados?|featured|populares|mas vendidos|mejores vendidos|bestsellers?|lo mas vendido|top( ventas)?)$/.test(qn)) {
    const destacados = products
      .filter((p) => p.isFeatured || p.isBestSeller)
      .sort((a, b) => Number(b.isFeatured ?? false) - Number(a.isFeatured ?? false) || b.soldCount - a.soldCount);
    return (limit ? destacados.slice(0, limit) : destacados).map((product) => ({ product, score: 100 }));
  }

  const results = products
    .map((p) => ({ product: p, score: scoreProductForQuery(p, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.product.soldCount - a.product.soldCount);
  return limit ? results.slice(0, limit) : results;
}

// Categorías cuyo nombre o subcategorías coinciden con la búsqueda (para chips de acceso directo)
export function matchCategories(query: string): SuperCategory[] {
  const q = normalize(query).trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  if (!tokens.length) return [];
  return superCategories.filter((c) => {
    const names = [c.name, ...c.subcategories.map((s) => s.name)].map(normalize);
    return names.some((n) => tokens.some((t) => stems(t).some((s) => n.includes(s))));
  });
}