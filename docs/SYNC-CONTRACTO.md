# Contrato de Sync — StarShop (cuerpo) ↔ ACS (cerebro)

Interfaz oficial entre los dos repos. Dirección única: **StarShop es la fuente
de verdad, ACS mantiene una copia operativa por tienda**. Nunca al revés.

## 1. Clave de identidad

- `storeId` (ACS) === `slug` de `tenants` (StarShop). Ej: `ferreteria-martinez`.
- El widget lo manda en cada mensaje (`FloatingButtons.tsx` → `storeId: STORE_ID`,
  desde `NEXT_PUBLIC_STARSHOP_TENANT_ID`, default `seed-store`).
- `STARSHOP_TENANT_ID` (server) acepta slug o uuid; el adaptador lo resuelve a
  uuid contra `public.tenants` (`resolveTenantId`).

## 2. Endpoints que expone StarShop

| Endpoint | Lee de | Uso |
|---|---|---|
| `GET /api/store/products` | `db.catalog` (provider activo) | Sync legacy del admin ACS — misma forma de antes + `source: <provider>` |
| `GET /api/tenant/catalog?tenant=<slug>` | `db.catalog` (provider activo) | **Puente oficial por tenant** — ACS sincroniza con `storeId` = slug |

Respuesta mínima por producto: `externalId|id`, `sku`, `title|name`,
`description`, `price`, `compareAtPrice|originalPrice`, `stock`, `images`,
`category`, `subcategory`, `brand`, `url`, más `syncedAt` y `total` a nivel raíz.

## 3. Reglas del sync (idempotencia y conflictos)

- Clave idempotente: **`(storeId, sku)`** → re-ejecutar el sync nunca duplica.
- En StarShop la DB lo garantiza: `unique (tenant_id, sku)` + `seed-catalog.sql`
  con `on conflict (tenant_id, sku) do update`; stock con
  `on conflict (branch_id, product_id)`.
- `lastSyncedAt`: ACS guarda por tienda cuándo sincronizó (`syncedAt` del payload).
- Conflictos: si el precio/stock cambió en StarShop, **gana StarShop** (fuente de
  verdad); ACS solo reindexa. El checkout nunca lee de ACS.
- Frecuencia sugerida: sync manual al publicar catálogo + cron diario por tienda.

## 4. Cambios pendientes del lado ACS (repo `agentic-commerce-stack`)

1. **Filtro por `storeId` en la búsqueda** (único cambio de código obligatorio):
   la tool de búsqueda hoy es global; debe filtrar por tienda para no recomendar
   productos de otro cliente.
2. **Sync por tienda**: script `acs:sync --store=<slug>` que lea
   `GET <tienda>/api/tenant/catalog?tenant=<slug>` y haga upsert en
   `StoreConnection` + `Product` (reutilizar `diagnose-stores` / `test-search`).
3. **CORS por cliente**: agregar el dominio de cada ferretería a
   `ALLOWED_ORIGINS` (solo env, sin código).

## 5. Onboarding de un cliente nuevo (checklist)

1. Supabase del cliente → correr `supabase/schema.sql`.
2. `npx tsx scripts/seed-catalog.ts <slug>` → pegar `seed-catalog.sql`
   (o cargar el catálogo real del cliente con el mismo formato).
3. Deploy Vercel con `DATA_PROVIDER=supabase` + `SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY` + `STARSHOP_TENANT_ID=<slug>` +
   `NEXT_PUBLIC_STARSHOP_TENANT_ID=<slug>` + dominio custom.
4. Dominio en `ALLOWED_ORIGINS` de ACS + `acs:sync --store=<slug>`.
5. Verificar: `GET /api/tenant/catalog?tenant=<slug>` (total > 0) y respuesta
   del agente filtrada por `storeId`.
