"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatCLP } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Mail, Building2 } from "lucide-react";
import Image from "next/image";

export default function CotizacionPage() {
  const { items, total } = useCart();
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const subtotal = total();
  const iva = Math.round(subtotal * 0.19);
  const totalConIva = subtotal + iva;

  const download = () => {
    const lines = [
      "STARSHOP — COTIZACIÓN EXPRESS (DEMO / MOCKUP)",
      "==============================================",
      `Empresa: ${empresa || "(sin nombre)"}`,
      `RUT: ${rut || "(sin RUT)"}`,
      `Email: ${email || "(sin email)"}`,
      `Fecha: ${new Date().toLocaleDateString("es-CL")}`,
      "",
      "Este documento es DEMO con productos mockup — no es cotización válida.",
      "",
      "DETALLE",
      ...items.map((i) => `- ${i.product.name} x${i.quantity}  ${formatCLP(i.product.price * i.quantity)}  (SKU ${i.product.sku})`),
      "",
      `Subtotal neto: ${formatCLP(subtotal)}`,
      `IVA 19%: ${formatCLP(iva)}`,
      `TOTAL: ${formatCLP(totalConIva)}`,
      "",
      "Validez: 48h (demo). Responder a ventas@starshop.cl",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cotizacion-starshop-demo-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <FileText className="h-12 w-12 mx-auto text-zinc-400" />
        <h1 className="text-2xl font-black mt-4">Cotizador Express (demo)</h1>
        <p className="text-zinc-500 mt-2">Agrega productos mockup al carrito para generar una cotización de ejemplo.</p>
        <p className="text-xs text-amber-600 mt-1">Catálogo con productos mockup — no son productos reales.</p>
        <Link href="/" className="inline-block mt-6"><Button variant="starshop">Explorar catálogo demo</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-2xl font-black flex items-center gap-2"><FileText className="h-6 w-6" /> Cotizador Express (demo)</h1>
      <p className="text-sm text-zinc-500 mt-1">Genera una cotización en TXT con tu carrito mockup. Ideal para B2B — este flujo es solo demostración.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-800">Productos <strong>mockup</strong>: precios y stock son de ejemplo, no representan oferta real.</div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border p-6 mt-6 grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium flex items-center gap-1"><Building2 className="h-4 w-4" /> Empresa / Razón social</label>
          <Input placeholder="Constructora Demo SpA" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">RUT</label>
          <Input placeholder="76.123.456-7" value={rut} onChange={(e) => setRut(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium flex items-center gap-1"><Mail className="h-4 w-4" /> Email</label>
          <Input placeholder="compras@empresa.cl" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border p-6 mt-6">
        <h2 className="font-bold">Detalle ({items.length} productos mockup)</h2>
        <div className="divide-y mt-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="py-3 flex gap-3">
              <Image src={product.images[0]} alt={product.name} width={64} height={64} className="h-16 w-16 object-cover rounded border" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2">{product.name}</div>
                <div className="text-xs text-zinc-500">{product.brand} • {product.sku} • Cant: {quantity}</div>
              </div>
              <div className="text-sm font-bold text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(product.price * quantity)}</div>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal neto</span><span className="text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(subtotal)}</span></div>
          <div className="flex justify-between"><span>IVA 19%</span><span>{formatCLP(iva)}</span></div>
          <div className="flex justify-between font-black text-base border-t pt-2"><span>Total</span><span className="text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(totalConIva)}</span></div>
        </div>
        <Button onClick={download} className="w-full mt-6 gap-2" variant="starshop"><Download className="h-4 w-4" /> Descargar cotización TXT (demo)</Button>
        <p className="text-xs text-zinc-500 mt-2 text-center">Se descarga un .txt con tu RUT/empresa. Luego envíalo a <strong>ventas@starshop.cl</strong> (flujo mockup).</p>
      </div>
    </div>
  );
}
