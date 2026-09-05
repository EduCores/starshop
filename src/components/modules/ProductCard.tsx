"use client";
import { Product } from "@/types";
import { formatCLP } from "@/lib/utils";
import { Star, ShoppingCart, FileText, ShieldCheck, Heart, Eye, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { useAgent } from "@/store/agent";
import Link from "next/link";
import { motion } from "framer-motion";

export function ProductCard({ product, showOriginalPrice = false, addButtonVariant = "default" as const }: { product: Product; showOriginalPrice?: boolean; addButtonVariant?: "default" | "starshop" }) {
  const { addItem, setOpen } = useCart();
  const openAgent = useAgent((s) => s.openWithProduct);
  const hasDiscount = product.discount && product.originalPrice;

  const handleAdd = (e?: React.MouseEvent) => {
    if (e) {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      window.dispatchEvent(new CustomEvent("star-fly", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
    }
    // timing: estrella vuela 850ms, luego carrito recibe con burst 650ms, luego abre
    setTimeout(() => addItem(product), 850);
    setTimeout(() => setOpen(true), 1550);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group bg-white dark:bg-zinc-900 rounded-lg border hover:shadow-xl transition-shadow flex flex-col overflow-hidden"
    >
      <Link href={`/producto/${product.id}`} className="relative aspect-square bg-zinc-50 dark:bg-zinc-800 overflow-hidden block sm:aspect-auto sm:max-h-[220px]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 16 }}>
              <Badge variant="discount">-{product.discount}%</Badge>
            </motion.div>
          )}
          {product.isNew && <Badge variant="new">NUEVO</Badge>}
          {product.isBestSeller && <Badge className="bg-[#FFA41C] text-black">Más Vendido</Badge>}
        </div>
        {/* Wishlist & quick view - fix dark: icono blanco invisible → negro sobre blanco */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
          <button className="h-7 w-7 bg-white rounded-full shadow flex items-center justify-center text-black hover:bg-zinc-100 transition-transform hover:scale-110 border border-zinc-200" aria-label="Favorito">
            <Heart className="h-3.5 w-3.5 text-black fill-black/10 stroke-black" />
          </button>
          <button className="h-7 w-7 bg-white rounded-full shadow flex items-center justify-center text-black hover:bg-zinc-100 transition-transform hover:scale-110 border border-zinc-200" aria-label="Vista rápida">
            <Eye className="h-3.5 w-3.5 text-black stroke-black" />
          </button>
        </div>
        {product.secCertified && (
          <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> SEC
          </span>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <div className="text-[11px] text-zinc-500 font-medium">
          {product.brand} • {product.sku}
        </div>
        <Link href={`/producto/${product.id}`} className="text-sm font-medium leading-tight line-clamp-2 sm:min-h-[32px] hover:text-[#FF3B30] hover:underline">
          {product.name}
        </Link>

        <div className="flex items-center gap-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? "fill-[#FFA41C] text-[#FFA41C]" : "text-zinc-300"}`} />
            ))}
          </div>
          <span className="text-xs text-[#007185] hover:underline cursor-pointer">({product.reviewCount})</span>
          <span className="text-xs text-zinc-400">• Vendidos {product.soldCount}</span>
        </div>

        <div className="mt-auto space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(product.price)}</span>
            {showOriginalPrice && product.originalPrice && <span className="text-xs line-through text-zinc-400">{formatCLP(product.originalPrice)}</span>}
          </div>
          {product.tierPrices && <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">Mayorista: {formatCLP(product.tierPrices[product.tierPrices.length - 1].price)}</div>}
          <Link href={`/producto/${product.id}#comparador`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007185] hover:underline">
            <Scale className="h-3 w-3" /> Comparar precios en el mercado
          </Link>
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <Button size="sm" variant={addButtonVariant} className="h-8 text-xs font-bold gap-1 w-full" onClick={handleAdd}>
              <ShoppingCart className="h-3.5 w-3.5" /> Agregar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 w-full"
              onClick={() => {
                openAgent(product.name);
                // animación simpática: vibración del botón agente se maneja en FloatingButtons vía pendingProduct
              }}
            >
              <FileText className="h-3.5 w-3.5" /> Cotizar
            </Button>
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" /> Stock: {product.stock} • Envío 24h
          </div>
        </div>
      </div>
    </motion.div>
  );
}
