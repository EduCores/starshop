# Arquitectura de Datos — StarShop (portable / multi-tenant)

## 1. El puerto: todo pasa por `src/data/provider.ts`

La app **nunca** importa SDKs de base de datos directo. Habla solo con la
interfaz `DataProvider` (el "puerto" o patrón adaptador):

```
  UI / APIs (checkout, webpay, mercadopago)
        │  import { db } from "@/data"   ← interfaz agnóstica
        ▼
        ┌──────────────────────────────┐
        │  src/data/                   │
        │  • provider.ts  (interfaz)   │
        │  • local.ts     (adaptador)  │
        │  • supabase.ts  (adaptador)  │
        └──────┬───────────────┬───────┘
               │               │
    data/orders.json    Supabase (o el proveedor que sea)
    mock-data.ts        Postgres + RLS multi-tenant
```

**Consecuencia:** para usar otra base de datos en otro proyecto solo
implementas la interfaz y cambias `DATA_PROVIDER`. Cero cambios en la UI.

## 2. Modelo multi-tenant — `supabase/schema.sql`

Tablas con `tenant_id` + **Row Level Security** (aisla ferretería A de B):

| Tabla | Función |
|---|---|
| `tenants` | El cliente (empresa). `slug`, `domain`, `brand`, `plan` |
| `branches` | Sucursales (2+ por cliente) — base del multi-sucursal |
| `profiles` | Staff del cliente: `role` (owner/admin/staff), `branch_id` |
| `products` | Catálogo POR tenant (precios, specs, SEC, tier prices) |
| `stock` | Inventario **por sucursal** (PK: branch_id + product_id) |
| `orders` | Órdenes por tenant (equivale a `data/orders.json`) |
| `posts` | Automatización RRSS (draft → scheduled → published) |

Extras: vista `catalog_with_stock`, helpers `current_tenant_id()` /
`is_tenant_admin()`, y políticas RLS completas.

## 3. Cambiar de proveedor = costo acotado

| Destino | Qué hay que tocar | Esfuerzo |
|---|---|---|
| **Supabase** (Postgres+RLS) | Adaptador supabase.ts (ya está) + correr schema.sql | ✅ listo |
| **Neon / Railway PG / Render PG + Prisma** | Generar `prisma/schema.prisma` del mismo SQL + adaptador Prisma | ½ día |
| **Prisma + SQLite en volumen** | Misma cosa con `provider = sqlite` + volver a ejecutar SQL | ½ día |
| **Turso (libSQL serverless)** | Adaptador contra el cliente de Turso (SQL casi idéntico a SQLite) | ½ día |
| **Mongo/Firebase/etc.** | Adaptador nuevo + ajustar tipos | 1-2 días |

Siempre igual: **sin tocar UI, checkout ni compuertas de pago.**

## 4. En el primer cliente

1. `npm i @supabase/supabase-js` (ya instalado)
2. Crear proyecto Supabase → correr `supabase/schema.sql` en el SQL editor
3. Insertar `tenants` + `branches` + crear usuarios en Supabase Auth/Settings → `profiles`
4. En el deploy: `DATA_PROVIDER=supabase` + `SUPABASE_URL` + service key + `STARSHOP_TENANT_ID`
5. Seed: importar catálogo (existe `scripts/generate-excel.mjs` + CSV) o usar el panel (Supabase Studio) — los productos del cliente se gestionan ahí, sin tocar código