# 🚀 Checklist de Producción — StarShop

## 1. Pasarelas de pago

### Transbank Webpay Plus
- [ ] Credenciales reales en https://www.transbankdevelopers.cl/
- [ ] Variables en el panel del PaaS:
  - `WEBPAY_COMMERCE_CODE` (código de comercio de producción)
  - `WEBPAY_API_KEY` (secreto de producción)
  - `WEBPAY_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL=https://tu-dominio.cl` (construye el `returnUrl`)

Tarjetas de prueba (solo integración): `4051885600446623`, CVV `123`, RUT `11.111.111-1`.

### MercadoPago
- [ ] Access token de producción (`APP_USR-xxx`) en `MERCADOPAGO_ACCESS_TOKEN`
- [ ] El webhook `/api/mercadopago/webhook` es público; con token configurado **valida el pago real** vía `Payment.get()` antes de marcar la orden como aprobada
- [ ] En local, probar notificaciones requiere ngrok (el flujo por `back_urls` funciona sin ngrok)

## 2. Persistencia (IMPORTANTE)

`data/orders.json` y `data/users.json` funcionan en **local y en VMs con disco persistente** (Railway/Render/Fly con volume). En **serverless (Vercel) el filesystem es efímero**: las órdenes y usuarios no sobreviven entre instancias/deploys.

- [ ] Si despliegas en Vercel: migrar órdenes y usuarios a PostgreSQL con Prisma (deps ya instaladas; falta crear `schema.prisma` y los modelos `Order`/`User`)
- [ ] Si despliegas en PaaS con volumen persistente: montar `data/` en el volumen

## 3. Auth

- [ ] `NEXTAUTH_SECRET` fuerte en producción (sin el fallback de desarrollo)
- [ ] Configurar el proveedor OAuth (ej. Google) con el dominio real

## 4. Otros

- [ ] `NEXT_PUBLIC_ACS_API_URL` apuntando al deployment del agente (ACS)
- [ ] Revisar que las imágenes de producto definitivas reemplacen los placeholders de Unsplash que quedan (p003, p011, p013 + segundas imágenes de p001/p002/p004)
- [ ] `npm run build` verde antes de cada release

## 5. Smoke test post-deploy

```bash
E2E_BASE_URL=https://tu-dominio.cl npx playwright test
```
(ejecuta los mismos tests e2e contra producción; el test de transferencia crea una orden real en tu store)
