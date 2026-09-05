"use client";
import { useMemo, useState } from "react";
import { Product } from "@/types";
import { getPriceComparison } from "@/lib/price-comparator";
import { cn, formatCLP } from "@/lib/utils";
import {
  Scale,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Store,
  ExternalLink,
  ArrowDownWideNarrow,
  Sparkles,
  Info,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Comparador de precios: muestra el precio de un producto en Starshop vs. el
 * mercado chileno (demo). Los precios externos son simulados y deterministas.
 */
export function PriceComparator({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(true);
  const [cheapestFirst, setCheapestFirst] = useState(true);

  const comparison = useMemo(() => getPriceComparison(product), [product]);
  const offers = useMemo(() => {
    const list = [...comparison.offers];
    return cheapestFirst ? list : list.reverse();
  }, [comparison, cheapestFirst]);

  return (
    <section
      id="comparador"
      className="border-t border-zinc-200 dark:border-zinc-800 px-4 md:px-6 py-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black leading-tight">Comparador de precios</h2>
            <p className="text-xs text-zinc-500">
              Este producto en {comparison.competitorCount + 1} tiendas del mercado chileno
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Ocultar comparador" : "Mostrar comparador"}
          className="p-2 -m-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 px-3 py-2">
              <TrendingDown className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-bold">
                  Mejor precio total
                </div>
                <div className="text-sm font-black text-emerald-800 dark:text-emerald-300 truncate">
                  {formatCLP(comparison.lowestTotal)} · {comparison.lowestStore}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 px-3 py-2">
              <Store className="h-4 w-4 text-zinc-500 shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 font-bold">Promedio mercado</div>
                <div className="text-sm font-black">{formatCLP(comparison.marketAverage)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 px-3 py-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400 font-bold">En Starshop</div>
                <div className="text-sm font-black truncate">
                  {formatCLP(comparison.starshopTotal)}
                  <span className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                    {" "}· ahorras {formatCLP(Math.max(0, comparison.starshopSavings))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1">
              <Info className="h-3 w-3" /> Incluye envío en el precio final.
            </span>
            <button
              type="button"
              onClick={() => setCheapestFirst((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007185] hover:underline"
            >
              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
              Ordenar: {cheapestFirst ? "menor a mayor precio" : "mayor a menor precio"}
            </button>
          </div>
{/* Lista de ofertas */}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
            {offers.map((offer) => (
              <li
                key={offer.store}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2.5",
                  offer.isLowest && "bg-emerald-50/70 dark:bg-emerald-950/30",
                  offer.isStarshop && "bg-amber-50/60 dark:bg-zinc-800/40"
                )}
              >
                {/* Tienda */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                      offer.accent
                    )}
                  >
                    {offer.initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold truncate">{offer.store}</span>
                      {offer.isLowest && (
                        <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                          Mejor precio
                        </Badge>
                      )}
                      {offer.isStarshop && (
                        <Badge className="bg-[#FFD814] text-black text-[10px] px-1.5 py-0">
                          Te lo vendemos
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{offer.deliveryTime}</div>
                  </div>
                </div>
{/* Precio / total / CTA */}
                <div className="flex items-center justify-between gap-4 sm:justify-end sm:flex-1 sm:shrink-0">
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black">{formatCLP(offer.price)}</div>
                    <div className="text-[11px] text-zinc-500">
                      {offer.shippingCost === 0 ? "Envío gratis" : `+ ${formatCLP(offer.shippingCost)} envío`}
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-400 font-bold">Total</div>
                    <div
                      className={cn(
                        "text-sm font-black",
                        offer.isLowest && "text-emerald-700 dark:text-emerald-400"
                      )}
                    >
                      {formatCLP(offer.total)}
                    </div>
                  </div>
                  {offer.isStarshop ? (
                    <a
                      href="#buy-box"
                      className="inline-flex items-center gap-1 text-xs font-bold h-8 px-3 rounded-md bg-[#FFD814] hover:bg-[#F7CA00] text-black border border-[#F2C200] shrink-0"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                    </a>
                  ) : (
                    <a
                      href={offer.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold h-8 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shrink-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Ver oferta
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            * Precios de referencia simulados para demostración — no constituyen oferta real. Envío
            considerado para la Región Metropolitana.
          </p>
        </>
      )}
    </section>
  );
}