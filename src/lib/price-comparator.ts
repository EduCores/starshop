import { Product } from "@/types";

/**
 * Comparador de precios del mercado chileno (demo).
 *
 * Genera ofertas de referencia de forma DETERMINISTA según el producto:
 * el mismo producto siempre muestra el mismo conjunto de precios, así no hay
 * mismatches de hidratación ni precios que cambien en cada render.
 *
 * Aviso: los precios de las tiendas externas son simulados para la demo.
 */

const RM_SHIPPING_COST = 3990;
const FREE_SHIPPING_THRESHOLD = 49990;

export interface PriceOffer {
  store: string;
  storeUrl: string;
  price: number;
  shippingCost: number;
  total: number;
  deliveryTime: string;
  isStarshop: boolean;
  isLowest: boolean;
  accent: string; // clases tailwind estáticas para el círculo del logo
  initial: string;
}

export interface PriceComparison {
  productId: string;
  offers: PriceOffer[];
  competitorCount: number;
  lowestTotal: number;
  lowestStore: string;
  marketAverage: number;
  starshopTotal: number;
  starshopSavings: number; // > 0 = en Starshop ahorras vs. promedio del mercado
}

interface StoreProfile {
  name: string;
  domain: string;
  accent: string;
  minFactor: number;
  maxFactor: number;
  shippingOptions: { cost: number; time: string }[];
}

const STORE_PROFILES: StoreProfile[] = [
  {
    name: "Mercado Libre",
    domain: "https://www.mercadolibre.cl",
    accent: "bg-amber-300 text-black",
    minFactor: 0.85,
    maxFactor: 1.0,
    shippingOptions: [
      { cost: 4990, time: "Envío Full 3-5 días" },
      { cost: 0, time: "Envío Full gratis" },
      { cost: 6990, time: "Envío estándar 5-7 días" },
    ],
  },
  {
    name: "Sodimac",
    domain: "https://www.sodimac.cl",
    accent: "bg-orange-500 text-white",
    minFactor: 0.94,
    maxFactor: 1.12,
    shippingOptions: [
      { cost: 5990, time: "Despacho 4-6 días" },
      { cost: 3990, time: "Despacho 5-8 días" },
      { cost: 0, time: "Retiro gratis en tienda" },
    ],
  },
  {
    name: "Easy",
    domain: "https://www.easy.cl",
    accent: "bg-red-500 text-white",
    minFactor: 0.97,
    maxFactor: 1.15,
    shippingOptions: [
      { cost: 5990, time: "Despacho 4-7 días" },
      { cost: 0, time: "Retiro gratis en tienda" },
    ],
  },
  {
    name: "Abcdin",
    domain: "https://www.abcdin.cl",
    accent: "bg-blue-600 text-white",
    minFactor: 0.9,
    maxFactor: 1.08,
    shippingOptions: [
      { cost: 4990, time: "Despacho 3-5 días" },
      { cost: 3990, time: "Despacho 5-7 días" },
    ],
  },
  {
    name: "Ripley",
    domain: "https://simple.ripley.cl",
    accent: "bg-sky-500 text-white",
    minFactor: 0.9,
    maxFactor: 1.1,
    shippingOptions: [
      { cost: 4990, time: "Despacho 3-6 días" },
      { cost: 0, time: "Envío gratis" },
    ],
  },
  {
    name: "Hites",
    domain: "https://www.hites.com",
    accent: "bg-fuchsia-600 text-white",
    minFactor: 0.88,
    maxFactor: 1.05,
    shippingOptions: [
      { cost: 3990, time: "Despacho 3-5 días" },
      { cost: 0, time: "Despacho gratis" },
    ],
  },
];

/** Hash determinista de string → seed */
function hashCode(value: string): number {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h) ^ value.charCodeAt(i);
  }
  return h >>> 0;
}

/** PRNG determinista (mulberry32) para que la demo sea estable entre renders */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundPrice(value: number): number {
  return Math.max(990, Math.round(value / 10) * 10);
}

function searchUrl(domain: string, product: Product): string {
  const q = encodeURIComponent(`${product.brand} ${product.name}`);
  return `${domain}/search?query=${q}`;
}

export function getPriceComparison(product: Product): PriceComparison {
  const rand = mulberry32(hashCode(`${product.id}|${product.sku}`));
  const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)];

  // Oferta local de Starshop (incluye regla de envío gratis RM desde $49.990)
  const starshopShipping = product.price >= FREE_SHIPPING_THRESHOLD ? 0 : RM_SHIPPING_COST;
  const starshopTotal = product.price + starshopShipping;

  const offers: PriceOffer[] = [
    {
      store: "Starshop",
      storeUrl: "",
      price: product.price,
      shippingCost: starshopShipping,
      total: starshopTotal,
      deliveryTime:
        starshopShipping === 0
          ? "Envío gratis Región Metropolitana (24-48h)"
          : "Envío 24-48h Región Metropolitana",
      isStarshop: true,
      isLowest: false,
      accent: "bg-[#FFD814] text-black",
      initial: "S",
    },
  ];

  // Ofertas de referencia de tiendas externas (precios simulados, estables por producto)
  for (const profile of STORE_PROFILES) {
    const factor = profile.minFactor + rand() * (profile.maxFactor - profile.minFactor);
    const price = roundPrice(product.price * factor);
    const ship = pick(profile.shippingOptions);
    offers.push({
      store: profile.name,
      storeUrl: searchUrl(profile.domain, product),
      price,
      shippingCost: ship.cost,
      total: price + ship.cost,
      deliveryTime: ship.time,
      isStarshop: false,
      isLowest: false,
      accent: profile.accent,
      initial: profile.name.charAt(0),
    });
  }

  // Ordenado por total asc y marcamos la mejor oferta
  offers.sort((a, b) => a.total - b.total);
  offers[0] = { ...offers[0], isLowest: true };

  const competitors = offers.filter((o) => !o.isStarshop);
  const starshopOffer = offers.find((o) => o.isStarshop) ?? offers[0];
  const marketAverage = Math.round(
    competitors.reduce((acc, o) => acc + o.total, 0) / competitors.length
  );

  return {
    productId: product.id,
    offers,
    competitorCount: competitors.length,
    lowestTotal: offers[0].total,
    lowestStore: offers[0].store,
    marketAverage,
    starshopTotal: starshopOffer.total,
    starshopSavings: marketAverage - starshopOffer.total,
  };
}