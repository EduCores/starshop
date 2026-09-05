"use client";
import { useState } from "react";
import { Product, ShippingOption } from "@/types";
import { formatCLP } from "@/lib/utils";
import { chileRegions, getChileShipping } from "@/lib/mock-data";
import { ShippingRegionComunaSelect } from "@/components/modules/ShippingRegionComunaSelect";
import { Star, ShieldCheck, Truck, FileDown, Minus, Plus, ShoppingCart, Heart, Share2, Award, Check, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { toast } from "@/store/toast";
import { motion, useAnimation } from "framer-motion";
import { PriceComparator } from "@/components/modules/PriceComparator";
import { useIsMounted } from "@/hooks/use-is-mounted";

export function ProductDetail({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [region, setRegion] = useState(chileRegions.find((r) => r.zone === "rm")?.name ?? chileRegions[0].name);
  const [comuna, setComuna] = useState("");
  const { addItem, setOpen } = useCart();
  const mounted = useIsMounted();
  const { has, toggle } = useFavorites();
  // El estado persistido solo es seguro leerlo tras el montaje (evita mismatch de hidratación)
  const isSaved = mounted && has(product.id);
  const heartControls = useAnimation();

  const tierPrice = product.tierPrices?.find((t) => qty >= t.minQty && (t.maxQty === undefined || qty <= t.maxQty))?.price ?? product.price;
  const total = tierPrice * qty;
  const shippingInfo = getChileShipping(region, total);

  const handleSave = () => {
    const next = !isSaved;
    toggle(product.id);
    // Animación del corazón: pop + giro, re-ejecuta en cada clic
    heartControls.start({
      scale: [1, 1.5, 1],
      rotate: [0, -15, 15, 0],
      transition: { duration: 0.5, ease: "easeOut" },
    });
    toast(next ? "Guardado en favoritos" : "Eliminado de favoritos", {
      variant: next ? "success" : "info",
      description: product.name,
    });
  };

  return (
    <div className="container mt-4 bg-white dark:bg-zinc-900 rounded-lg border overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
        {/* Gallery */}
        <div className="space-y-3 min-w-0">
          <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden border">
            <img src={product.images[selectedImage]} alt={product.name} className="h-full w-full object-contain p-4" />
          </div>
           <div className="flex gap-2 overflow-x-auto">
             {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`h-16 w-16 rounded border-2 overflow-hidden ${selectedImage === i ? "border-[#FF3B30]" : "border-zinc-200"}`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
            <div className="h-16 w-16 rounded border border-dashed flex flex-col items-center justify-center text-[10px] text-zinc-500">
              <FileDown className="h-4 w-4" /> Ficha PDF
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded">
              <ShieldCheck className="h-3 w-3" /> Certificación SEC
            </span>
            <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 px-2 py-1 rounded">Garantía {product.warranty}</span>
          </div>
        </div>

        {/* Info */}
        <div id="buy-box" className="space-y-4 min-w-0">
          <div>
            <div className="text-xs text-zinc-500">
              {product.brand} • SKU: {product.sku} • {product.subcategory}
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight mt-1">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-[#FFA41C] text-[#FFA41C]" : "text-zinc-300"}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <a href="#reviews" className="text-sm text-[#007185] hover:underline">
                {product.reviewCount} calificaciones
              </a>
              <span className="text-zinc-300">|</span>
              <span className="text-sm text-emerald-600 font-medium">Vendidos {product.soldCount}+</span>
            </div>
          </div>

          <div className="border-y py-4 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(tierPrice)}</span>
              {product.originalPrice && product.originalPrice !== tierPrice && (
                <Badge variant="discount">-{product.discount}% OFF</Badge>
              )}
            </div>
            <div className="text-xs text-zinc-600">
              Precio sin IVA: {formatCLP(Math.round(tierPrice / 1.19))} • IVA incluido • Factura B2B disponible
            </div>
            <a href="#comparador" className="inline-flex items-center gap-1 text-xs font-semibold text-[#007185] hover:underline">
              <Scale className="h-3 w-3" /> Comparar precios en el mercado
            </a>
            {product.tierPrices && (
              <div className="mt-3">
                <div className="text-xs font-bold flex items-center gap-1">
                  <Award className="h-3 w-3 text-amber-600" /> Descuento por Volumen
                </div>
                 <div className="grid grid-cols-3 gap-2 mt-2">
                   {product.tierPrices.map((t) => (
                     <div key={t.label} className={`border rounded p-2 text-center text-xs ${qty >= t.minQty && (t.maxQty === undefined || qty <= t.maxQty) ? "border-[#FF3B30] bg-amber-50 dark:bg-amber-950/40" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"}`}>
                       <div className="font-bold text-zinc-700 dark:text-zinc-200">{t.label}</div>
                        <div className="font-black text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(t.price)}</div>
                       {qty >= t.minQty && (t.maxQty === undefined || qty <= t.maxQty) && <div className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1"><Check className="h-3 w-3" /> Activo</div>}
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium dark:text-zinc-200">Cantidad:</span>
              <div className="flex items-center border rounded-full dark:border-zinc-700 dark:bg-zinc-800">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-8 w-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-full">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold dark:text-white">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-full">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{product.stock} disponibles</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                className="flex-1 min-w-[200px] bg-[#FFD814] hover:bg-[#F7CA00] text-black border border-[#F2C200] font-bold gap-2"
                onClick={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  window.dispatchEvent(new CustomEvent("star-fly", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
                  setTimeout(() => addItem(product, qty), 850);
                  setTimeout(() => setOpen(true), 1550);
                }}
              >
                <ShoppingCart className="h-5 w-5" /> Agregar al Carrito
              </Button>
              <Button
                size="lg"
                variant="outline"
                aria-pressed={isSaved}
                onClick={handleSave}
                className={`gap-2 ${isSaved ? "border-[#FF3B30] bg-red-50 dark:bg-red-950/30 text-[#FF3B30] dark:text-[#FF6B6B]" : ""}`}
              >
                <motion.span animate={heartControls} className="inline-flex">
                  <Heart
                    className={`h-4 w-4 transition-colors duration-200 ${
                      isSaved ? "fill-[#FF3B30] text-[#FF3B30]" : "text-zinc-500"
                    }`}
                  />
                </motion.span>
                {isSaved ? "Guardado" : "Guardar"}
              </Button>
              <Button size="icon" variant="ghost">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center text-sm font-bold text-[#6b7280] dark:text-[#f9fafb]">Subtotal ({qty}): {formatCLP(total)}</div>
          </div>

          <div className="border rounded-lg p-3 space-y-3 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Truck className="h-5 w-5 text-emerald-600 shrink-0" />
              Calcula tu envío
            </div>
            <ShippingRegionComunaSelect
              className="mt-2"
              region={region}
              comuna={comuna}
              onRegionChange={(v) => {
                setRegion(v);
                setComuna("");
              }}
              onComunaChange={setComuna}
            />
            <span className="inline-block text-sm font-bold px-3 py-1.5 bg-white dark:bg-zinc-800 border rounded">
              {formatCLP(shippingInfo.cost)} • {shippingInfo.estimatedDays}
            </span>
            <div className="text-xs text-emerald-600 mt-1">✓ Envío gratis RM sobre {formatCLP(49990)}</div>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="font-bold">Especificaciones</h3>
             <div className="grid grid-cols-2 gap-2">
               {Object.entries(product.specs).map(([k, v]) => (
                 <div key={k} className="flex justify-between gap-2 border-b py-1.5 text-xs min-w-0">
                   <span className="text-zinc-500 shrink-0">{k}</span>
                   <span className="font-medium text-right break-words min-w-0">{v}</span>
                 </div>
               ))}
             </div>
            <a href="#" className="inline-flex items-center gap-1 text-[#007185] hover:underline text-xs">
              <FileDown className="h-3 w-3" /> Descargar ficha técnica PDF
            </a>
          </div>
        </div>
      </div>

      <PriceComparator product={product} />
    </div>
  );
}
