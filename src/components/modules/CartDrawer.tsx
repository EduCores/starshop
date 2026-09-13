"use client";
import { useCart } from "@/store/cart";
import Image from "next/image";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { formatCLP } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, ShoppingCart, Truck, Trash2, ShieldCheck } from "lucide-react";
import Link from "next/link";

const FREE_SHIPPING_THRESHOLD = 49990;

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQty, removeItem, total } = useCart();
  const mounted = useIsMounted();
  if (!mounted) return null;

  const subtotal = total();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setOpen(false)} aria-hidden />}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-zinc-900 shadow-2xl z-[70] transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="bg-[#232F3E] text-white p-4 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Carrito
            <span className="bg-white text-[#232F3E] text-xs px-2 py-0.5 rounded-full font-bold">{items.reduce((a, b) => a + b.quantity, 0)} items</span>
          </h2>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded" aria-label="Cerrar carrito">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free shipping bar */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-b">
          <div className="flex items-center gap-2 text-sm">
            <Truck className={`h-4 w-4 ${freeShipping ? "text-emerald-600" : "text-amber-600"}`} />
            {freeShipping ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">¡Felicidades! Tienes envío gratis 🎉</span>
            ) : (
              <span className="text-zinc-700 dark:text-zinc-300">
                Agrega <strong className="text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(remaining)}</strong> para <strong>Envío Gratis</strong> RM
              </span>
            )}
          </div>
          <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF3B30] to-[#FFD814] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <ShoppingCart className="h-10 w-10 text-zinc-400" />
              </div>
              <h3 className="font-bold">Tu carrito está vacío</h3>
              <p className="text-sm text-zinc-500 mt-1">Explora ofertas y agrega productos para verlos aquí</p>
              <Button onClick={() => setOpen(false)} className="mt-4" variant="starshop">
                Seguir comprando
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="p-4 flex gap-3">
                  <Image src={product.images[0]} alt={product.name} width={80} height={80} className="h-20 w-20 object-cover rounded border bg-white" />
                  <div className="flex-1 min-w-0">
                    <Link href="#" className="text-sm font-medium line-clamp-2 hover:text-[#FF3B30] leading-tight">
                      {product.name}
                    </Link>
                    <div className="text-xs text-zinc-500 mt-1">{product.brand} • {product.sku}</div>
                    {product.secCertified && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded mt-1">
                        <ShieldCheck className="h-3 w-3" /> SEC
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(product.price)}</span>
                      <div className="flex items-center gap-1 border rounded-full">
                        <button onClick={() => updateQty(product.id, quantity - 1)} className="h-7 w-7 flex items-center justify-center hover:bg-zinc-100 rounded-full" aria-label="Disminuir">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                        <button onClick={() => updateQty(product.id, quantity + 1)} className="h-7 w-7 flex items-center justify-center hover:bg-zinc-100 rounded-full" aria-label="Aumentar">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(product.id)} className="self-start p-1 text-zinc-400 hover:text-red-600" aria-label="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-zinc-50 dark:bg-zinc-900 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} productos)</span>
              <span className="font-bold text-lg text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(subtotal)}</span>
            </div>
            <p className="text-xs text-zinc-500">Impuestos y envío calculados en el checkout</p>
            <Link href="/checkout" onClick={() => setOpen(false)} className="block">
              <Button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black border border-[#F2C200] font-bold h-10">
                Proceder al Pago
              </Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Seguir comprando
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-3 w-3" /> Pago seguro • Garantía Starshop • Factura B2B
            </div>
          </div>
        )}
      </div>
    </>
  );
}
