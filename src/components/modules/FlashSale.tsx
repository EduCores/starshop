"use client";
import { useMemo } from "react";
import { products } from "@/lib/mock-data";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCLP } from "@/lib/utils";
import Image from "next/image";
import { Flame, ChevronRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";

export function FlashSale() {
  // target: tomorrow 23:59 (calculado una sola vez y estable entre renders,
  // para no reiniciar el intervalo del countdown ni causar desigualdades de hidratación)
  const target = useMemo(() => {
    const t = new Date();
    t.setHours(23, 59, 59, 999);
    t.setDate(t.getDate() + 1);
    return t;
  }, []);

  // null mientras no esté montado en el cliente: se muestran 00:00:00,
  // luego useEffect lo reemplaza por el tiempo real sin romper la hidratación.
  const timeLeft = useCountdown(target);
  const hours = timeLeft?.hours ?? 0;
  const minutes = timeLeft?.minutes ?? 0;
  const seconds = timeLeft?.seconds ?? 0;
  const flashProducts = products.filter((p) => p.isFlashSale).slice(0, 6);
  const { addItem, setOpen } = useCart();

  return (
    <section id="flash-sale" className="container mt-6">
      <Reveal>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 p-3 md:p-4 border-b bg-gradient-to-r from-[#FF3B30] to-[#FF6B00] text-white">
            <h2 className="font-black text-lg md:text-xl flex items-center gap-2">
              <span className="bg-white text-[#FF3B30] p-1 rounded">
                <Flame className="h-5 w-5" />
              </span>
              OFERTAS RELÁMPAGO
            </h2>
            <span className="hidden md:inline text-sm bg-black/20 px-2 py-1 rounded">Termina en:</span>
            <div className="flex items-center gap-1">
              {[
                { v: hours, l: "HRS" },
                { v: minutes, l: "MIN" },
                { v: seconds, l: "SEG" },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="bg-black text-white font-mono font-bold text-sm md:text-base px-2 py-1 rounded min-w-[36px] text-center overflow-hidden">
                    {i === 2 ? (
                      <motion.span
                        key={seconds}
                        initial={{ y: "-70%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="inline-block"
                      >
                        {String(t.v).padStart(2, "0")}
                      </motion.span>
                    ) : (
                      String(t.v).padStart(2, "0")
                    )}
                  </div>
                  {i < 2 && <span className="font-bold">:</span>}
                </div>
              ))}
            </div>
          <Link href="#" className="ml-auto text-sm font-bold flex items-center gap-1 hover:underline">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products horizontal scroll */}
        <div className="p-3 md:p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {flashProducts.map((p) => {
            const soldPercent = Math.round((p.soldCount / (p.soldCount + p.stock)) * 100);
            return (
              <Link key={p.id} href={`/producto/${p.id}`} className="border rounded-lg overflow-hidden hover:shadow-lg transition group bg-white dark:bg-zinc-900 block">
                <div className="relative aspect-square bg-zinc-50 overflow-hidden">
                  <Image src={p.images[0]} alt={p.name} width={600} height={600} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                  {p.discount && (
                    <span className="absolute top-2 left-2 bg-[#FF3B30] text-white text-xs font-black px-1.5 py-0.5 rounded">-{p.discount}%</span>
                  )}
                  <span className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded text-center">
                    🔥 Vendidos: {p.soldCount}
                  </span>
                </div>
                <div className="p-2.5 space-y-1.5">
                  <h3 className="text-xs font-medium line-clamp-2 leading-tight min-h-[32px]">{p.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(p.price)}</span>
                    {p.originalPrice && <span className="text-[11px] line-through text-zinc-400">{formatCLP(p.originalPrice)}</span>}
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF3B30] to-[#FF6B00] rounded-full" style={{ width: `${soldPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>Vendido: {soldPercent}%</span>
                      <span>Quedan {p.stock}</span>
                    </div>
                  </div>
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs font-bold bg-[rgb(255_89_22/var(--tw-bg-opacity,1))] hover:bg-[rgb(230_81_20/var(--tw-bg-opacity,1))] text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        window.dispatchEvent(new CustomEvent("star-fly", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
                        setTimeout(() => addItem(p), 850);
                        setTimeout(() => setOpen(true), 1550);
                      }}
                    >
                      Agregar
                    </Button>
                </div>
              </Link>
            );
          })}
        </div>
        </div>
      </Reveal>
    </section>
  );
}
