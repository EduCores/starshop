"use client";
import { useCart } from "@/store/cart";
import { formatCLP } from "@/lib/utils";
import { chileRegions, getChileShipping } from "@/lib/mock-data";
import { ShippingRegionComunaSelect } from "@/components/modules/ShippingRegionComunaSelect";
import { PaymentMethod, Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Truck, ShieldCheck, Lock, CreditCard } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Email inválido"),
  rut: z.string().min(8, "RUT requerido"),
  nombre: z.string().min(2, "Nombre requerido"),
  telefono: z.string().min(8, "Teléfono requerido"),
  direccion: z.string().min(5, "Dirección requerida"),
  region: z.string().min(1, "Región requerida"),
  comuna: z.string().min(2, "Comuna requerida"),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [region, setRegion] = useState(chileRegions[0].name);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("webpay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Evita mismatch de hidratación: el carrito viene de localStorage (Zustand persist).
  // Servidor y primer render del cliente ven carrito vacío; el estado real se aplica post-montaje.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const subtotal = total();
  const shippingInfo = getChileShipping(region, subtotal);
  const shippingCost = shippingInfo.cost;
  const estimatedDays = shippingInfo.estimatedDays;
  const grandTotal = subtotal + shippingCost;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { region: chileRegions[0].name, comuna: "" },
  });
  const comunaValue = watch("comuna");

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const orderId = `#ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const buyOrder = orderId.replace("#ORD-", "ORD");
    const order: Order = {
      orderId,
      items: items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.images[0],
      })),
      subtotal,
      shippingCost,
      grandTotal,
      paymentMethod,
      region,
      comuna: data.comuna,
      customer: {
        nombre: data.nombre,
        email: data.email,
        rut: data.rut,
        telefono: data.telefono,
        direccion: data.direccion,
      },
      estimatedDays,
      createdAt: new Date().toISOString(),
    };

    // Guardar orden pendiente para recuperar tras retorno de la pasarela
    sessionStorage.setItem("starshop-last-order", JSON.stringify(order));

    // Persistir también en el servidor (fire-and-forget: si falla, el checkout continúa)
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch(() => {});

    try {
      if (paymentMethod === "transferencia") {
        clearCart();
        router.push("/checkout/success?gateway=transferencia");
        return;
      }

      if (paymentMethod === "webpay") {
        const origin = window.location.origin;
        const sessionId = `S${Date.now()}`;
        const returnUrl = `${origin}/checkout/webpay/return`;

        const res = await fetch("/api/webpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyOrder, sessionId, amount: grandTotal, returnUrl }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error iniciando Webpay");

        // Transbank pide redirigir a url + token_ws
        window.location.href = `${json.url}?token_ws=${json.token}`;
        return;
      }

      if (paymentMethod === "mercadopago") {
        const origin = window.location.origin;
        const mpItems = order.items.map((it) => ({
          title: it.name,
          quantity: it.quantity,
          unit_price: it.price,
        }));

        const res = await fetch("/api/mercadopago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: mpItems,
            payer: { email: data.email },
            externalReference: buyOrder,
            backUrls: {
              success: `${origin}/checkout/success?gateway=mercadopago`,
              failure: `${origin}/checkout/success?gateway=mercadopago&status=failure`,
              pending: `${origin}/checkout/success?gateway=mercadopago&status=pending`,
            },
            notificationUrl: `${origin}/api/mercadopago/webhook`,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error creando preferencia MercadoPago");

        const redirectUrl = json.init_point || json.sandbox_init_point;
        if (!redirectUrl) throw new Error("MercadoPago no devolvió init_point");
        window.location.href = redirectUrl;
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error procesando el pago";
      alert(msg);
      setIsSubmitting(false);
    }
  };

  if (!mounted || items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">{mounted ? "Tu carrito está vacío" : "Cargando checkout..."}</h1>
        <p className="text-zinc-500 mt-2">
          {mounted ? "Agrega productos para continuar al checkout" : "Restaurando tu carrito"}
        </p>
        {mounted && (
          <Link href="/" className="inline-block mt-4">
            <Button variant="starshop">Volver a la tienda</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 grid lg:grid-cols-3 gap-6 min-w-0">
      {/* Form */}
      <div className="lg:col-span-2 min-w-0 bg-white dark:bg-zinc-900 rounded-lg border p-6">
        <h1 className="text-xl font-black flex items-center gap-2">
          <Lock className="h-5 w-5" /> Checkout Seguro
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Guest Checkout — No necesitas crear cuenta. Factura B2B disponible.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input placeholder="empresa@correo.cl" {...register("email")} className="mt-1" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">RUT / DNI *</label>
              <Input placeholder="76.123.456-7" {...register("rut")} className="mt-1" />
              {errors.rut && <p className="text-xs text-red-600 mt-1">{errors.rut.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Nombre / Razón Social *</label>
              <Input placeholder="Starshop SpA" {...register("nombre")} className="mt-1" />
              {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono *</label>
              <Input placeholder="+56 9 8765 4321" {...register("telefono")} className="mt-1" />
              {errors.telefono && <p className="text-xs text-red-600 mt-1">{errors.telefono.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Dirección *</label>
            <Input placeholder="Av. Matta 1234, Depto 5" {...register("direccion")} className="mt-1" />
            {errors.direccion && <p className="text-xs text-red-600 mt-1">{errors.direccion.message}</p>}
          </div>

          <ShippingRegionComunaSelect
            className="grid md:grid-cols-3 gap-4"
            comunaClassName="md:col-span-2"
            region={region}
            comuna={comunaValue}
            comunaError={errors.comuna?.message}
            onRegionChange={(v) => {
              setRegion(v);
              setValue("region", v, { shouldValidate: false });
              setValue("comuna", "", { shouldValidate: false });
            }}
            onComunaChange={(v) => setValue("comuna", v, { shouldValidate: true })}
          />

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm">
            <Truck className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-black">Envío: {formatCLP(shippingCost)} • {estimatedDays}</div>
              <div className="text-zinc-600 text-xs">Envío gratis RM sobre $49.990. Factura y cotización B2B disponible post-compra.</div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Método de pago
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { id: "webpay", label: "WebPay", desc: "Tarjeta / Transbank" },
                { id: "mercadopago", label: "MercadoPago", desc: "Cuotas" },
                { id: "transferencia", label: "Transferencia B2B", desc: "Factura" },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1 transition ${
                    paymentMethod === m.id ? "border-[#FF3B30] bg-red-50/60 dark:bg-red-950/30" : "hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment"
                      value={m.id}
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id as PaymentMethod)}
                      className="accent-[#FF3B30]"
                    />
                    <span className="font-bold text-sm">{m.label}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{m.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black border border-[#F2C200] font-black text-base disabled:opacity-60">
            {isSubmitting ? "Procesando..." : `Pagar ${formatCLP(grandTotal)} • Pedido Seguro`}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="h-3 w-3" /> Pago encriptado • WebPay • Transferencia • Factura B2B
          </div>
        </form>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border p-6 h-fit min-w-0">
        <h2 className="font-bold">Resumen del pedido</h2>
        <div className="divide-y mt-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="py-3 flex gap-3">
              <img src={product.images[0]} alt={product.name} className="h-16 w-16 object-cover rounded border" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</div>
                <div className="text-xs text-zinc-500">Cant: {quantity}</div>
              </div>
              <div className="text-sm font-bold text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(product.price * quantity)}</div>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío ({estimatedDays})</span>
            <span className={shippingCost === 0 ? "text-emerald-600 font-bold" : ""}>{shippingCost === 0 ? "GRATIS" : formatCLP(shippingCost)}</span>
          </div>
          <div className="flex justify-between font-black text-base border-t pt-2">
            <span>Total</span>
            <span className="text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(grandTotal)}</span>
          </div>
        </div>
        <div className="mt-4 h-2 bg-zinc-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (subtotal / 49990) * 100)}%` }} />
        </div>
        <p className="text-xs text-zinc-500 mt-2 text-center">Compra protegida Starshop • Cambios 30 días</p>
      </div>
    </div>
  );
}
