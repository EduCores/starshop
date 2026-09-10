---
name: payments-chile
description: Integra Webpay Plus, MercadoPago y transferencia en StarShop. Use when touching src/app/api/webpay, src/app/api/mercadopago, checkout, NEXT_PUBLIC_APP_URL, transbank-sdk.
---

# Payments Chile - StarShop

## Flujos actuales
- **B2C tarjeta:** Webpay / MercadoPago con redirect.
- **B2B transferencia:** sin pasarela, genera orden y muestra datos Banco de Chile 123-45678-90 / 76.123.456-7 en `/checkout/success`.

### Webpay (transbank-sdk 6.1.1)
1. Checkout `POST /api/webpay` con `{buyOrder, amount}` -> `{url, token}`.
2. Redirect: `window.location = url?token_ws=token`.
3. Retorno: `/checkout/webpay/return?token_ws=...` -> `POST /api/webpay/commit`.
4. Éxito si `status=AUTHORIZED` y `response_code=0`.
- Archivos: `src/app/api/webpay/route.ts` (create, fallback a commerce 597055555532 si no hay env), `src/app/api/webpay/commit/route.ts` (soporta POST y GET `?token_ws=`), `src/app/checkout/webpay/return/page.tsx`.
- `returnUrl = ${NEXT_PUBLIC_APP_URL}/checkout/webpay/return`.

### MercadoPago (mercadopago 3.5.0)
1. Checkout `POST /api/mercadopago` con `{items, payer}` -> `{init_point}`.
2. Redirect a `init_point` -> vuelve a `/checkout/success?gateway=mercadopago` vía `back_urls`.
- Archivos: `src/app/api/mercadopago/route.ts`, `src/app/api/mercadopago/webhook/route.ts` (log + 200).
- Sin `MERCADOPAGO_ACCESS_TOKEN` devuelve 500 esperado.

## Env vars (.env.example)
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
# WEBPAY_COMMERCE_CODE / WEBPAY_API_KEY / WEBPAY_ENV=integration|production
# MERCADOPAGO_ACCESS_TOKEN=TEST-xxx o APP_USR-xxx
```
- Integración Webpay funciona sin env. Producción: pedir credenciales en transbankdevelopers.cl.
- PaaS (Vercel/Railway/Render): configurar mismas vars en dashboard.

## Test local
- Webpay tarjeta: `4051885600446623` CVV 123, fecha futura, RUT `11.111.111-1`.
- MercadoPago: token TEST + tarjetas de su docs.
- Webhook local requiere ngrok porque `/api/mercadopago/webhook` debe ser público.
- Checkout bifurca por método en `src/app/checkout/page.tsx` (onSubmit llama API y redirige, guarda orden en sessionStorage, limpia carrito).

## Reglas
- Nunca commitear tokens reales. Usar `.env.local`.
- Mantener `?gateway=mercadopago&status=failure/pending` en `checkout/success/page.tsx`.
- No romper flujo B2B transferencia manual.
