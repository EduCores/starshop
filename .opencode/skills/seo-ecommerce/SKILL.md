---
name: seo-ecommerce
description: SEO de StarShop con sitemap, robots y JSON-LD. Use when touching src/app/sitemap.ts, robots.ts, JsonLd, producto, categoria, metadata, posicionamiento SSR.
---

# SEO Ecommerce - StarShop

## Archivos
- `src/app/sitemap.ts`: BASE_URL `https://starshop.cl`, incluye home + `/blog` + `/cotizacion` + `/workflows/builder` + `superCategories` (`/categoria/[slug]`) + `products` (`/producto/[id]`) + `blogPosts` (`/blog/[slug]`).
- `src/app/robots.ts`: `allow: /`, `disallow: [/checkout, /checkout/success]`, `sitemap: https://starshop.cl/sitemap.xml`.
- `src/components/seo/JsonLd.tsx`: Schema.org `Product` + `BreadcrumbList`, inyectado en `producto/[id]`.
- `src/app/not-found.tsx`, `src/app/error.tsx` (con reset).
- `src/app/categoria/[slug]/page.tsx` es server (SSR para posicionamiento), `CategoryView.tsx` es client.

## Reglas
- Toda nueva ruta pública (`/categoria`, `/producto`, `/blog`) debe agregarse a `sitemap.ts` con `changeFrequency` y `priority` coherentes.
- Nunca indexar `/checkout`: mantener en `robots.ts` disallow.
- Producto nuevo: mantener forma `Product/SuperCategory` en `src/lib/mock-data.ts` para no romper sitemap ni JsonLd.
- Cambiar `BASE_URL` si cambia dominio; actualizar `host` y `sitemap` en `robots.ts`.
- Verificar con `npm run build` que sitemap/robots generen (39-70 páginas estáticas según contenido).

## Metadata
- Usar `generateMetadata` en páginas server de categoría/producto.
- Imágenes remotas permitidas: `images.unsplash.com`, `picsum.photos`, `**.placehold.co` (ver `next.config.js`).
