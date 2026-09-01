import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  TrainFront,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Smartphone,
  Clock,
  LifeBuoy,
  Truck,
  ShieldCheck,
  FileText,
  Lightbulb,
  Wrench,
  Ruler,
  ShieldAlert,
  Instagram,
  Facebook,
} from "lucide-react";
import "./globals.css";
import Link from "next/link";
import { Header } from "@/components/modules/Header";
import { CartDrawer } from "@/components/modules/CartDrawer";
import { FloatingButtons } from "@/components/modules/FloatingButtons";
import { FlyingStars } from "@/components/modules/FlyingStars";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://starshop.cl"),
  title: {
    default: "Starshop | Distribuidor Mayorista Herramientas, LED e Instrumentos",
    template: "%s | Starshop",
  },
  description: "Starshop - Líder en distribución masiva de herramientas, iluminación LED, instrumentos de medición y artículos eléctricos. Envíos a todo Chile. Venta mayorista B2B. (Catálogo demo con productos mockup)",
  keywords: ["herramientas", "led", "iluminacion", "multimetro", "starshop", "chile", "ferreteria", "b2b", "mayorista"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://starshop.cl",
    siteName: "Starshop",
    title: "Starshop | Distribuidor Mayorista",
    description: "Herramientas, LED e instrumentos con despacho a todo Chile. Catálogo demo.",
    images: [{ url: "/og-starshop.jpg", width: 1200, height: 630, alt: "Starshop" }],
  },
  twitter: { card: "summary_large_image", title: "Starshop | Distribuidor Mayorista", description: "Catálogo demo — Herramientas, LED e instrumentos." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[#F5F5F5] dark:bg-zinc-950`}>
        <Providers>
          <Header />
          <CartDrawer />
          <FloatingButtons />
          <FlyingStars />
          <main className="min-h-screen max-w-full overflow-x-hidden">{children}</main>
          <footer className="relative bg-black text-white mt-12">
            {/* Capa estrellas: tenues (40%) sobre el negro, por todo el footer */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[url('/back_stars.webp')] bg-repeat opacity-40" />
            {/* Logo mascota: con su transparencia natural, sobre las estrellas */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[url('/logo_footer_mascota.png')] bg-no-repeat bg-[position:right_20px_bottom_20px] bg-[length:220px] md:bg-[length:300px]" />
            <div className="relative z-10 container py-12 px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
              {/* Marca */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Link href="/" className="inline-flex items-baseline text-[26px] font-black tracking-tight leading-none select-none notranslate" translate="no">
                    <span className="text-[#fbffff]">ST</span>
                    <span className="star-slot" aria-hidden>
                      <span className="star-ghost">A</span>
                      <span className="star-float">
                        <img src="/star2.svg" alt="" className="star-logo star-anim-show" />
                      </span>
                    </span>
                    <span className="text-[#fbffff]">R</span>
                    <span className="text-[#fdd817]">SHOP</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <a href="#" aria-label="Instagram" className="h-8 w-8 rounded-full bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] text-black flex items-center justify-center hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))] transition-colors">
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a href="#" aria-label="Facebook" className="h-8 w-8 rounded-full bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] text-black flex items-center justify-center hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))] transition-colors">
                      <Facebook className="h-4 w-4" />
                    </a>
                    <a href="https://wa.me/56993301557" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] text-black flex items-center justify-center hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))] transition-colors">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Distribuidor masivo de herramientas, iluminación LED y artículos eléctricos. Más de 15 años
                  abasteciendo a contratistas e industrias.
                </p>
                <p className="mt-3">© 2026 Starshop SpA. Todos los derechos reservados.</p>
              </div>

              {/* Ayuda + Categorías */}
              <div>
                <h4 className="text-base font-bold mb-3">Ayuda</h4>
                <ul className="space-y-3 text-base text-zinc-300">
                  {[
                    { Icon: LifeBuoy, label: "Centro de Ayuda" },
                    { Icon: Truck, label: "Envíos & Retiros" },
                    { Icon: ShieldCheck, label: "Garantías SEC" },
                    { Icon: FileText, label: "Cotizaciones B2B" },
                  ].map(({ Icon, label }) => (
                    <li key={label}>
                      <a href="#" className="flex items-center gap-3 hover:text-white hover:underline">
                        <Icon className="h-6 w-6 shrink-0 text-[#FFD814]" />
                        <span>{label}</span>
                      </a>
                    </li>
                  ))}
                  <li>
                    <Link href="/blog" className="flex items-center gap-3 hover:text-white hover:underline">
                      <FileText className="h-6 w-6 shrink-0 text-[#FFD814]" />
                      <span>Blog (guías demo)</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/workflows/builder" className="flex items-center gap-3 hover:text-white hover:underline">
                      <FileText className="h-6 w-6 shrink-0 text-[#FFD814]" />
                      <span>Builder visual (demo)</span>
                    </Link>
                  </li>
                </ul>
                <h5 className="text-base font-bold mt-5 mb-3">Categorías</h5>
                <ul className="space-y-3 text-base text-zinc-300">
                  {[
                    { Icon: Lightbulb, label: "Iluminación LED" },
                    { Icon: Wrench, label: "Herramientas" },
                    { Icon: Ruler, label: "Instrumentos de Medición" },
                    { Icon: ShieldAlert, label: "Seguridad Eléctrica" },
                  ].map(({ Icon, label }) => (
                    <li key={label}>
                      <a href="#" className="flex items-center gap-3 hover:text-white hover:underline">
                        <Icon className="h-6 w-6 shrink-0 text-[#FFD814]" />
                        <span>{label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contacto */}
              <div>
                <h4 className="text-base font-bold mb-3">Contacto</h4>
                <ul className="space-y-3 text-base text-zinc-300">
                  <li className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 shrink-0 text-[#FFD814]" />
                    <span>Jecar Nehgme 70 - Santiago</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <TrainFront className="h-6 w-6 shrink-0 text-[#FFD814]" />
                    <span>Metro: República</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-6 w-6 shrink-0 text-[#FFD814]" />
                    <a href="mailto:ventas@starshop.cl" className="hover:text-white hover:underline">
                      ventas@starshop.cl
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-6 w-6 shrink-0 text-[#FFD814]" />
                    <a href="tel:+56226972072" className="hover:text-white hover:underline">
                      22 697 2072
                    </a>
                    <span className="text-zinc-500">(Fijo)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 shrink-0 text-[#FFD814]" />
                    <a href="https://wa.me/56993301557" className="hover:text-white hover:underline">
                      +56 9 9330 1557
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Smartphone className="h-6 w-6 shrink-0 text-[#FFD814]" />
                    <a href="https://wa.me/56989005158" className="hover:text-white hover:underline">
                      +56 9 8900 5158
                    </a>
                  </li>
                </ul>
              </div>

              {/* Horario */}
              <div>
                <h4 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Clock className="h-6 w-6 shrink-0 text-[#FFD814]" />
                  Horario Atención
                </h4>
                <ul className="space-y-3 text-base text-zinc-300">
                  <li className="flex items-center gap-3">
                    <span>Lun - Jue</span>
                    <span className="text-white font-medium">10:00 - 18:00h</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span>Vie</span>
                    <span className="text-white font-medium">10:00 - 16:00h</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span>Sáb - Dom</span>
                    <span>Cerrado</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="relative z-10 py-4 px-4 text-center text-xs text-zinc-400">
              Pagos seguros: WebPay • Transferencia • Factura B2B • Certificación SEC disponible en productos
              seleccionados
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
