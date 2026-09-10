---
name: test-playwright
description: Build, lint y tests Playwright de StarShop. Use when touching tests, npm run build, npm run lint, @playwright/test, tsx scripts, validacion pre-deploy.
---

# Test Playwright - StarShop

## Comandos
```
npm run dev     # next dev (localhost:3000)
npm run build   # next build, debe dar verde 39-70 páginas
npm run start   # next start
npm run lint    # next lint (eslint + eslint-config-next 14.2.5)
npx playwright test
npx tsx scripts/probar-agente.mjs
node scripts/generate-excel.mjs
```

## Qué validar
- Build genera categorías (8), productos (23), checkout/success, sitemap/robots sin errores de tipos (TS 5.5.3 strict).
- Flujos críticos: home -> categoria/[slug] (filtros precio/SEC/B2B/orden) -> producto/[id] (TierPrice) -> add cart (toast) -> checkout (Zod guest 1 paso) -> webpay/mercadopago/transferencia -> success limpia carrito.
- Auth: /login y /registro, sesión con role/rut.
- Hidratación: Header/CartDrawer sin mismatch (use-is-mounted + Zustand persist).
- Pagos: `POST /api/webpay` 200 sin env; mercadopago sin token da 500 esperado.

## Reglas
- Nuevo feature: correr `npm run lint` + `npm run build` antes de dar por listo.
- Test Playwright nuevo en patrón `@playwright/test 1.62.1`.
- Scripts `tsx` en `scripts/` (generate-embeddings, probar-agente, generate-excel con exceljs).
- No commitear `.next/`, `dev-server-*.log`, `devlog*.txt`.
