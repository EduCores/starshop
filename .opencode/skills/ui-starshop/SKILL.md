---
name: ui-starshop
description: UI StarShop con Tailwind, shadcn-style, Zustand y Framer Motion. Use when touching src/components, tailwind.config, globals.css, cart, toast, formatCLP, Header, ProductCard, dark mode.
---

# UI StarShop

## Stack UI
- Tailwind 3.4.6 + `tailwind.config.ts` (darkMode class, container 1400px, colores `starshop.primary #FF3B30`, `secondary #FF6B00`, `dark #0F1111`, `accent #FFD814`, `success #067D62`).
- Utils: `cn()` (clsx + tailwind-merge) y `formatCLP()` (`Intl.NumberFormat es-CL, CLP, 0 decimales`) en `src/lib/utils.ts`.
- `next-themes` (`attribute="class"`, default dark en `providers.tsx`), CSS vars en `globals.css`.
- Iconos `lucide-react`, animación `framer-motion` 11.3.2, `reactflow` 11.11.4 para workflows/builder.

## Componentes
- `src/components/ui/*`: Button, Badge, Input, Card + `src/components/ui/toast.tsx`.
- `src/components/modules/*`: Header (Topbar CLP/B2B/WhatsApp + Search autocomplete + MegaMenu + drawer móvil), CartDrawer (progreso envío gratis $49.990), HeroSection (carousel 5s), FlashSale (countdown + barra stock), CategoryStrip, B2BBanner, ProductCard (badge %, hover swap, TierPrice), ProductGrid (tabs), ProductDetail (galería, Tiered Pricing, SEC badge).
- Layout: `src/app/layout.tsx` (Header global + Providers + footer SEC + Toaster), `src/app/providers.tsx` (SessionProvider + ThemeProvider + QueryClientProvider).

## Estado
- `src/store/cart.ts`: Zustand persist `starshop-cart` (addItem/removeItem/updateQty/clearCart/total/count).
- `src/store/toast.ts` + `src/store/favorites.ts`, `src/store/agent.ts`.
- Hidratación: usar `src/hooks/use-is-mounted.ts` en Header/CartDrawer antes de leer persist. `use-countdown.ts` para FlashSale.

## Reglas
- Nuevo componente: usar `cn()` + variantes `starshop-*`, soportar dark/light.
- Precios siempre con `formatCLP`, sin decimales.
- Toasts vía store propio, no agregar dependencias.
- Drawer/modal móvil con Framer Motion, patrón de `CategoryView` / `CartDrawer`.
