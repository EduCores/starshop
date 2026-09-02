"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { superCategories, products } from "@/lib/mock-data";
import { useCart } from "@/store/cart";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { formatCLP } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  ShoppingCart,
  User,
  Menu,
  X,
  MapPin,
  Phone,
  FileText,
  MessageCircle,
  ChevronDown,
  Star,
  Flame,
  Award,
  Package,
  Grid3X3,
  Sun,
  Moon,
  Truck,
  ShieldCheck,
  Mail,
  Clock,
  Smartphone,
  Lightbulb,
  Wrench,
  Gauge,
  FlaskConical,
  Zap,
  BatteryCharging,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

const SUPER_ICON_MAP: Record<string, LucideIcon> = {
  Lightbulb,
  Wrench,
  Gauge,
  FlaskConical,
  Zap,
  BatteryCharging,
  ShieldCheck,
  Cpu,
};

export function Header() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [showMega, setShowMega] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  // Evita mismatch de hidratación: el carrito se persiste en localStorage (Zustand persist),
  // por lo que el conteo del servidor (0) difiere del cliente ya rehidratado.
  // El badge solo se renderiza después del montaje en el cliente.
  const mounted = useIsMounted();
  const { items, setOpen, count } = useCart();
  const cartCount = count();
  const [cartBurst, setCartBurst] = useState(0);
  const prevCartRef = useRef(0);
  useEffect(() => {
    if (!mounted) return;
    if (cartCount > prevCartRef.current) {
      setCartBurst((k) => k + 1);
      const t = setTimeout(() => setCartBurst(0), 900);
      return () => clearTimeout(t);
    }
    prevCartRef.current = cartCount;
  }, [cartCount, mounted]);
  useEffect(() => {
    prevCartRef.current = cartCount;
  }, [mounted]);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const filteredProducts = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  const router = useRouter();
  // Enter en el buscador -> búsqueda genérica global (/busqueda?q=)
  const goToSearch = () => {
    const q = search.trim();
    if (!q) return;
    setShowAutocomplete(false);
    router.push(`/busqueda?q=${encodeURIComponent(q)}`);
  };

  // Mega menú: cierre retrasado para que el usuario alcance el panel sin que desaparezca
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMega = () => {
    if (megaCloseTimer.current) {
      clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
    setShowMega(true);
  };
  const closeMega = () => {
    megaCloseTimer.current = setTimeout(() => setShowMega(false), 300);
  };
  useEffect(() => {
    return () => {
      if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    };
  }, []);

  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 180);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* STICKY HEADER - solo LOGO + BUSCADOR + CARRITO */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#131921] text-white border-b border-white/10"
          >
            <div className="container flex h-[60px] items-center gap-2 md:gap-4 px-4 relative">
              <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Starshop - Inicio">
                <span className="relative inline-flex items-baseline text-[26px] md:text-[28px] font-black tracking-tight leading-none select-none" translate="no">
                  <span className="text-[#fbffff]">ST</span>
                  <span className="star-slot" aria-hidden>
                    <span className="star-ghost">A</span>
                    <span className="star-float">
                      <img src="/star2.svg" alt="" className="star-logo star-anim-show" />
                    </span>
                  </span>
                  <span className="text-[#fbffff]">R</span>
                  <span className="text-[#fdd817]">SHOP</span>
                </span>
              </Link>
              <div className="flex-1 max-w-3xl mx-2 md:mx-4">
                <div className="flex">
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowAutocomplete(true);
                    }}
                    onFocus={() => setShowAutocomplete(true)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                    onKeyDown={(e) => e.key === "Enter" && goToSearch()}
                    placeholder="Buscar herramientas, LED, instrumentos..."
                    className="h-10 rounded-l-md rounded-r-none bg-white text-black placeholder:text-zinc-500 border-0 focus-visible:ring-2 focus-visible:ring-[#F90] text-sm flex-1"
                  />
                  <Button
                    aria-label="Agente IA"
                    className="h-10 rounded-l-none rounded-r-md bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))] text-black px-4 border-0"
                  >
                    <Bot className="h-5 w-5" />
                  </Button>
                </div>
                {showAutocomplete && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[95vw] max-w-[760px] bg-white text-black dark:bg-zinc-900 dark:text-white rounded-md shadow-2xl border border-zinc-200 dark:border-zinc-700 z-50 max-h-[420px] overflow-auto mt-2">
                    {filteredProducts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/producto/${p.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b last:border-0 dark:border-zinc-700"
                        onClick={() => setShowAutocomplete(false)}
                      >
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 object-cover rounded border" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{p.brand} • {p.sku}</div>
                        </div>
                        <div className="text-sm font-bold text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(p.price)}</div>
                      </Link>
                    ))}
                    {search.trim() && (
                      <Link
                        href={`/busqueda?q=${encodeURIComponent(search.trim())}`}
                        onClick={() => setShowAutocomplete(false)}
                        className="block p-2.5 text-center text-xs font-semibold text-[#FF3B30] hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        Ver todos los resultados para &quot;{search.trim()}&quot;
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(true)}
                className="relative flex items-center gap-1 p-1.5 rounded-sm group hover:text-[#FFD814] transition-colors shrink-0"
                aria-label={`Carrito con ${mounted ? cartCount : 0} productos`}
              >
                <div className="relative">
                  <ShoppingCart className="h-7 w-7 group-hover:text-[#FFD814] transition-colors" />
                  {mounted && cartCount > 0 && (
                    <motion.span
                      key={`sticky-star-${cartBurst}-${cartCount}`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: cartBurst ? [1, 1.28, 1] : 1, rotate: cartBurst ? [0, -12, 12, 0] : 0 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="absolute -top-2.5 -right-2.5 w-[30px] h-[30px]"
                      aria-hidden
                    >
                      <img src="/star2.svg" alt=" estrella" className="w-full h-full object-contain" />
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 600, damping: 14 }}
                        className="absolute inset-0 flex items-center justify-center text-black text-[12px] font-extrabold leading-none pt-[3px]"
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </motion.span>
                    </motion.span>
                  )}
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full">
      {/* TOPBAR - como en ux-ui.png: Cotizaciones B2B | Venta Mayorista */}
      <div className="bg-[#232F3E] text-white text-xs md:text-[13px] block">
        <div className="container flex h-8 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="hidden lg:flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
              Enviar a <strong>Chile</strong> • CLP $
            </span>
            <span className="hidden lg:inline text-zinc-400">|</span>
            <Link href="#" className="flex items-center gap-1.5 hover:text-[#FFD814] transition-colors">
              <FileText className="h-3.5 w-3.5" /> Cotizaciones B2B
            </Link>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <Link href="#" className="flex items-center gap-1.5 hover:text-[#FFD814] transition-colors">
              <Package className="h-3.5 w-3.5" /> Venta Mayorista
            </Link>
            <motion.a
              href="mailto:ventas@starshop.cl"
              whileHover={{ scale: 1.05 }}
              className="hidden xl:flex items-center gap-1.5 hover:text-[#FFD814] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" /> ventas@starshop.cl
            </motion.a>
            <a href="tel:+56226972072" className="hidden lg:flex items-center gap-1.5 hover:text-white">
              <Phone className="h-3.5 w-3.5" /> 22 697 2072
            </a>
            <a href="https://wa.me/56993301557" target="_blank" className="hidden lg:flex items-center gap-1.5 bg-[#25D366] px-2 py-1 rounded-full text-white font-medium hover:bg-[#128C7E] transition-colors">
              <MessageCircle className="h-3.5 w-3.5" /> +56 9 9330 1557
            </a>
            <a href="https://wa.me/56989005158" target="_blank" className="hidden md:flex items-center gap-1.5 bg-[#128C7E] px-2 py-1 rounded-full text-white font-medium hover:bg-[#075E54] transition-colors">
              <Smartphone className="h-3.5 w-3.5" /> +56 9 8900 5158
            </a>
            <span className="hidden 2xl:flex items-center gap-1.5 text-zinc-300">
              <Clock className="h-3.5 w-3.5" /> Lun-Jue 10-18h | Vie 10-16h
            </span>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" className="p-1 hover:bg-white/10 rounded">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="bg-[#0F1111] md:bg-[#131921] text-white border-b border-white/10">
        <div className="container flex h-[60px] md:h-[64px] items-center gap-2 md:gap-4 px-4 relative">
          {/* Mobile menu button */}
          <button className="md:hidden p-2 -ml-2" onClick={() => setShowMobileMenu(!showMobileMenu)} aria-label="Menú">
            {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* LOGO - texto ST★RSHOP con estrella en lugar de la A */}
           <Link href="/" className="flex items-center gap-2 shrink-0 notranslate" aria-label="Starshop - Inicio" translate="no">
             <span className="relative inline-flex items-baseline text-[26px] md:text-[32px] font-black tracking-tight leading-none select-none" translate="no">
              <span className="text-[#fbffff]">ST</span>
              <span className="star-slot" aria-hidden>
                <span className="star-ghost">A</span>
                <span className="star-float">
                  <img src="/star2.svg" alt="" className="star-logo star-anim-show" />
                </span>
              </span>
              <span className="text-[#fbffff]">R</span>
              <span className="text-[#fdd817]">SHOP</span>
            </span>
            <span className="hidden md:block text-[10px] leading-tight text-zinc-400 font-medium">
              DISTRIBUIDOR
              <br />
              MAYORISTA
            </span>
          </Link>

          {/* DELIVER TO - pill como en ux-ui.png: visible en móvil */}
          <div className="flex items-center gap-1.5 text-xs shrink-0 bg-[#232F3E] px-2.5 py-1.5 rounded-md cursor-pointer group hover:bg-[#37475A] transition-colors">
            <MapPin className="h-3.5 w-3.5 text-white" />
            <span className="leading-none">
              <span className="text-zinc-300 hidden sm:inline">A todo </span>
              <span className="font-bold text-white">Chile</span>
            </span>
          </div>

          {/* MEGA SEARCHBAR - desktop: oculto en móvil, visible lg+ */}
          <div className="starshop-mega-search hidden lg:flex flex-1 max-w-4xl mx-2 md:mx-4">
            <div className="hidden md:flex items-center bg-[#E6E6E6] text-black text-xs px-2 rounded-l-md border-r border-zinc-300 gap-1 cursor-pointer hover:bg-zinc-200">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent outline-none py-2 pr-4 pl-1 text-xs font-medium w-[88px] max-w-[88px] truncate cursor-pointer"
                aria-label="Categoría"
              >
                <option>Todas</option>
                {superCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                onKeyDown={(e) => e.key === "Enter" && goToSearch()}
                placeholder="Buscar herramientas, LED, instrumentos..."
                className="h-10 rounded-none md:rounded-none rounded-l-md md:rounded-l-none rounded-r-none bg-white text-black placeholder:text-zinc-500 border-0 focus-visible:ring-2 focus-visible:ring-[#F90] text-sm"
              />
              {/* Autocomplete - centrado a viewport */}
              {showAutocomplete && filteredProducts.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[95vw] max-w-[760px] bg-white text-black dark:bg-zinc-900 dark:text-white rounded-md shadow-2xl border border-zinc-200 dark:border-zinc-700 z-50 max-h-[420px] overflow-auto">
                  {filteredProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/producto/${p.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b last:border-0 dark:border-zinc-700"
                      onClick={() => setShowAutocomplete(false)}
                    >
                      <img src={p.images[0]} alt={p.name} className="h-10 w-10 object-cover rounded border" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{p.brand} • {p.sku}</div>
                      </div>
                      <div className="text-sm font-bold text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(p.price)}</div>
                    </Link>
                  ))}
                  <div className="p-2 text-center border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">{filteredProducts.length} resultados</span>
                    <Link
                      href={`/busqueda?q=${encodeURIComponent(search.trim())}`}
                      onClick={() => setShowAutocomplete(false)}
                      className="text-xs font-semibold text-[#FF3B30] hover:underline"
                    >
                      Ver todos los resultados para &quot;{search.trim()}&quot;
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Button
              aria-label="Agente IA"
              className="h-10 rounded-l-none rounded-r-md bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))] text-black px-4 md:px-5 border-0"
            >
              <Bot className="h-5 w-5" />
            </Button>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {session?.user ? (
              <div className="hidden md:flex flex-col leading-tight p-1.5 rounded-sm group">
                <span className="text-xs text-zinc-300">Hola, {(session.user as unknown as { name?: string }).name || session.user.email}</span>
                <span className="text-sm font-bold flex items-center gap-1">
                  Cuenta {(session.user as unknown as { role?: string }).role === "B2B" ? "Empresa" : ""}{" "}
                  <button onClick={() => signOut()} className="ml-1 text-xs font-normal underline hover:text-[#FFD814]">Salir</button>
                </span>
              </div>
            ) : (
              <Link href="/login" className="hidden md:flex flex-col leading-tight p-1.5 rounded-sm group hover:text-[#FFD814] transition-colors">
                <span className="text-xs text-zinc-300 group-hover:text-[#FFD814] transition-colors">Hola, identificate</span>
                <span className="text-sm font-bold flex items-center gap-1 group-hover:text-[#FFD814] transition-colors">
                  Cuenta y Listas <ChevronDown className="h-3 w-3" />
                </span>
              </Link>
            )}
            <Link href="#" className="hidden md:flex flex-col leading-tight p-1.5 rounded-sm group hover:text-[#FFD814] transition-colors">
              <span className="text-xs text-zinc-300 group-hover:text-[#FFD814] transition-colors">Devoluciones</span>
              <span className="text-sm font-bold group-hover:text-[#FFD814] transition-colors">y Pedidos</span>
            </Link>

            <button
              onClick={() => setOpen(true)}
              className="relative flex items-end gap-1 p-1.5 rounded-sm group hover:text-[#FFD814] transition-colors"
              aria-label={`Carrito con ${mounted ? cartCount : 0} productos`}
            >
              <div className="relative">
                <ShoppingCart className="h-8 w-8 md:h-7 md:w-7 group-hover:text-[#FFD814] transition-colors" />
                  {mounted && cartCount > 0 && (
                    <motion.span
                      key={`star-${cartBurst}-${cartCount}`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: cartBurst ? [1, 1.28, 1] : 1, rotate: cartBurst ? [0, -12, 12, 0] : 0 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="absolute -top-2.5 -right-2.5 w-[30px] h-[30px]"
                      aria-hidden
                    >
                      <img src="/star2.svg" alt=" estrella" className="w-full h-full object-contain" />
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 600, damping: 14 }}
                        className="absolute inset-0 flex items-center justify-center text-black text-[12px] font-extrabold leading-none pt-[3px]"
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </motion.span>
                      <AnimatePresence>
                        {cartBurst > 0 &&
                          Array.from({ length: 6 }).map((_, i) => {
                            const angle = (i * 60 * Math.PI) / 180;
                            const dist = 20 + (i % 2) * 6;
                            return (
                              <motion.span
                                key={`${cartBurst}-${i}`}
                                initial={{ x: 0, y: 0, opacity: 1, scale: 0.9 }}
                                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.2 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.65, ease: "easeOut", delay: i * 0.03 }}
                                className="absolute left-1/2 top-1/2 -ml-1 -mt-1 pointer-events-none"
                              >
                                <img src="/star2.svg" alt="" className="h-2.5 w-2.5 object-contain drop-shadow-sm" />
                              </motion.span>
                            );
                          })}
                      </AnimatePresence>
                    </motion.span>
                  )}
              </div>
              <span className="hidden md:inline text-sm font-bold mb-1 group-hover:text-[#FFD814] transition-colors">Carrito</span>
            </button>

            <Link href="#" className="md:hidden p-2">
              <User className="h-6 w-6" />
            </Link>
          </div>
        </div>

        {/* SEARCH ROW MOBILE/TABLET - como en ux-ui.png: dentro del mismo header, fila abajo */}
        <div className="lg:hidden container pb-3 relative">
          <div className="flex">
            <div className="flex items-center bg-[#E6E6E6] text-black text-xs px-2 rounded-l-md border-r border-zinc-300 gap-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent outline-none py-2 pr-4 pl-1 text-xs font-medium w-[80px] max-w-[80px] truncate cursor-pointer"
                aria-label="Categoría"
              >
                <option>Todas</option>
                {superCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                onKeyDown={(e) => e.key === "Enter" && goToSearch()}
                placeholder="Buscar"
                className="h-10 rounded-none rounded-l-none rounded-r-none bg-white text-black placeholder:text-zinc-500 border-0 focus-visible:ring-2 focus-visible:ring-[#F90] text-sm"
              />
              {showAutocomplete && filteredProducts.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[90vw] max-w-[760px] bg-white text-black dark:bg-zinc-900 dark:text-white rounded-md shadow-2xl border border-zinc-200 dark:border-zinc-700 z-50 max-h-[420px] overflow-auto">
                  {filteredProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/producto/${p.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b last:border-0 dark:border-zinc-700"
                      onClick={() => setShowAutocomplete(false)}
                    >
                      <img src={p.images[0]} alt={p.name} className="h-10 w-10 object-cover rounded border" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{p.brand} • {p.sku}</div>
                      </div>
                      <div className="text-sm font-bold text-[#6b7280] dark:text-[#f9fafb]">{formatCLP(p.price)}</div>
                    </Link>
                  ))}
                  {search.trim() && (
                    <Link
                      href={`/busqueda?q=${encodeURIComponent(search.trim())}`}
                      onClick={() => setShowAutocomplete(false)}
                      className="block p-2.5 text-center text-xs font-semibold text-[#FF3B30] hover:bg-zinc-50 dark:hover:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700"
                    >
                      Ver todos los resultados para &quot;{search.trim()}&quot;
                    </Link>
                  )}
                </div>
              )}
            </div>
            <Button
              aria-label="Agente IA"
              className="h-10 rounded-l-none rounded-r-md bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))] text-black px-4 border-0"
            >
              <Bot className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* CATEGORY BAR - altura aislada starshop-category-bar (4.5rem) para no afectar otros h-10 */}
      {/* onMouseLeave en el contenedor común: mover mouse entre botón y panel NO cierra el menú */}
      <div className="bg-[#232F3E] text-white text-sm hidden md:block" onMouseLeave={closeMega}>
        <div className="container flex items-center gap-1 starshop-category-bar">
          <button
            onMouseEnter={openMega}
            onFocus={openMega}
            onClick={() => setShowMega(!showMega)}
            onKeyDown={(e) => e.key === "Escape" && setShowMega(false)}
            className="flex items-center gap-2 font-bold hover:text-[#FFD814] transition-colors px-2 py-1 rounded-sm h-8"
            aria-expanded={showMega}
            aria-haspopup="true"
          >
            <Menu className="h-7 w-7" /> Todas las categorías
          </button>

          <nav className="flex items-center gap-1 ml-2 font-semibold">
            <Link href="#flash-sale" className="flex items-center gap-1.5 px-3 py-1 font-semibold hover:text-[#FFD814] transition-colors rounded-sm">
              <Flame className="h-6 w-6 text-[#FF6B00]" /> Ofertas Relámpago
            </Link>
            <Link href="#mas-vendidos" className="flex items-center gap-1.5 px-3 py-1 font-semibold hover:text-[#FFD814] transition-colors rounded-sm">
              <Star className="h-6 w-6 text-[#FFD814]" /> Más Vendidos
            </Link>
            <Link href="#b2b" className="flex items-center gap-1.5 px-3 py-1 font-semibold hover:text-[#FFD814] transition-colors rounded-sm">
              <Award className="h-6 w-6" /> Venta Mayorista / B2B
            </Link>
            <Link href="#" className="px-3 py-1 font-semibold hover:text-[#FFD814] transition-colors rounded-sm">Servicio al Cliente</Link>
            <Link href="/cotizacion" className="px-3 py-1 font-semibold hover:text-[#FFD814] transition-colors rounded-sm hidden xl:inline">Cotizador Express</Link>
          </nav>

          <div className="ml-auto hidden lg:flex items-center gap-2 text-xs font-bold bg-[#37475A] px-3 py-1 rounded-sm">
            <span className="flex items-center gap-1"><Truck className="h-5 w-5 text-emerald-600" /> Envíos a todo Chile</span>
            <span className="opacity-50">|</span>
            <span className="flex items-center gap-1"><Zap className="h-5 w-5 text-[#FFD814]" /> Despacho 24h RM</span>
          </div>
        </div>

        {/* MEGA MENU - sin handlers propios: vive dentro del contenedor con onMouseLeave */}
        <AnimatePresence>
        {showMega && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 bg-white text-black dark:bg-zinc-900 dark:text-white shadow-2xl border-t-4 border-[rgb(253_216_23/var(--tw-border-opacity,1))] z-40"
          >
            <div className="container py-6 grid grid-cols-4 gap-6 max-h-[70vh] overflow-auto">
              {superCategories.map((cat) => {
                const Icon = SUPER_ICON_MAP[cat.icon];
                return (
                <div key={cat.id} className="space-y-2">
                  <h3 className="font-bold text-sm flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cat.color}`}>
                      {Icon && <Icon className="h-3.5 w-3.5 text-white" />}
                    </span>
                    {cat.name}
                  </h3>
                  <ul className="space-y-1">
                    {cat.subcategories.map((sub) => (
                      <li key={sub.id}>
                        <Link href={`/categoria/${cat.slug}`} className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-[#FF3B30] hover:underline flex justify-between">
                          <span>{sub.name}</span>
                          <span className="text-zinc-400">({sub.count})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                );
              })}
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 px-6 py-3 flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-200 font-bold">¿Eres empresa? Obtén precios mayoristas y facturación directa.</span>
              <Link href="#b2b" className="bg-[#232F3E] text-white px-4 py-1.5 rounded font-bold hover:bg-black">Solicitar Cuenta B2B</Link>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div className="md:hidden bg-white text-black dark:bg-zinc-900 dark:text-white absolute inset-x-0 top-[10vh] shadow-2xl z-50 max-h-[80vh] overflow-auto">
          <div className="p-4 pb-10 space-y-4">
            <div className="bg-[#232F3E] text-white -m-4 p-4 mb-4 flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><User className="h-5 w-5" /></div>
                {session?.user ? (
                  <div>
                    <div className="font-bold text-sm">{(session.user as unknown as { name?: string }).name || session.user.email}</div>
                    <div className="text-xs text-zinc-300">ir a mi cuenta • <button onClick={() => signOut()} className="underline">Salir</button></div>
                  </div>
                ) : (
                  <div><div className="font-bold text-sm">Hola, Usuario</div><div className="text-xs text-zinc-300">ir a mi cuenta</div></div>
                )}
              </div>
              <h4 className="ml-auto font-bold text-sm flex items-center gap-2"><Grid3X3 className="h-4 w-4" /> Todas las categorías</h4>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                {superCategories.map((c) => {
                  const Icon = SUPER_ICON_MAP[c.icon];
                  return (
                    <Link key={c.id} href={`/categoria/${c.slug}`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-2 rounded p-2 text-[1rem] font-medium text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${c.color}`}>
                        {Icon && <Icon className="h-4 w-4 text-white" />}
                      </span>
                      <span>{c.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3 text-base border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <a href="mailto:ventas@starshop.cl" className="flex items-center gap-3 py-2"><Mail className="h-6 w-6" /> ventas@starshop.cl</a>
                <a href="tel:+56226972072" className="flex items-center gap-3 py-2"><Phone className="h-6 w-6" /> 22 697 2072</a>
                <a href="https://wa.me/56993301557" className="flex items-center gap-3 py-2"><Smartphone className="h-6 w-6" /> +56 9 9330 1557</a>
                <a href="https://wa.me/56989005158" className="flex items-center gap-3 py-2"><Smartphone className="h-6 w-6" /> +56 9 8900 5158</a>
              </div>
              <div className="flex items-center gap-2 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 border border-zinc-200 dark:border-zinc-700">
                <Clock className="h-4 w-4" /> Lun-Jue 10:00-18:00h | Vie 10:00-16:00h
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
