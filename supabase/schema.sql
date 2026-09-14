-- ============================================================
-- STARSHOP — Esquema MULTI-TENANT (white-label por cliente)
-- Base: PostgreSQL (Supabase / Neon / Railway PG / Render PG)
-- Modelo portable: los adaptadores en src/data mapean 1:1 estas tablas.
-- Convierte cada tabla con `enable row level security` para aislar
-- los datos de la ferretería A de la B (RLS).
-- ============================================================

create extension if not exists pgcrypto;

-- 1) EMPRESA (tenant): una ferretería / cliente
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,            -- "ferreteria-martinez"
  name        text not null,
  domain      text unique,                     -- dominio custom white-label
  brand       jsonb not null default '{}',     -- logo, colores, whatsapp
  plan        text not null default 'starter'  -- starter | pro | enterprise
               check (plan in ('starter','pro','enterprise')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 2) SUCURSALES (multi-branch: stock y pickup por sucursal)
create table branches (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,                   -- "Sucursal Centro"
  address     text,
  region      text,
  comuna      text,
  phone       text,
  is_pickup   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- 3) USUARIOS del tenant (staff): rol por sucursal (owner|admin|staff)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references tenants(id) on delete cascade,
  branch_id   uuid references branches(id),    -- null = ve todas
  role        text not null default 'staff'
               check (role in ('owner','admin','staff')),
  full_name   text,
  rut         text,
  created_at  timestamptz not null default now()
);

-- 4) CATÁLOGO de productos POR TENANT
create table products (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  sku                text not null,
  name               text not null,
  slug               text,
  description        text,
  short_description  text,
  brand              text,
-- 5) STOCK POR SUCURSAL (inventario multi-branch)
create table stock (
  tenant_id  uuid not null references tenants(id) on delete cascade,
  branch_id  uuid not null references branches(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  qty        integer not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now(),
  primary key (branch_id, product_id)
);

-- 6) ÓRDENES (equivalentes a data/orders.json pero multi-tenant)
create table orders (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  branch_id       uuid references branches(id),
  order_id        text not null,                -- "#ORD-12345"
  customer        jsonb not null,
  items           jsonb not null,
  subtotal        integer not null,
  shipping_cost   integer not null default 0,
  grand_total     integer not null,
  payment_method  text not null
                   check (payment_method in ('webpay','mercadopago','transferencia')),
  payment_status  text not null default 'pending'
                   check (payment_status in ('pending','approved','rejected','failed','refunded')),
  gateway_ref     text,                          -- buy_order / external_reference
  region          text,
  comuna          text,
  created_at      timestamptz not null default now()
);
create index idx_orders_tenant ON orders(tenant_id, created_at desc);
create index idx_orders_gateway_ref on orders(gateway_ref);

-- 7) AUTOMATIZACIÓN DE RRSS (post generados por el agente)
create table posts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  platform     text not null,                    -- instagram | facebook | tiktok
  content      text,
  media_urls   text[] not null default '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  status       text not null default 'draft'
                check (status in ('draft','scheduled','published','failed')),
  created_at   timestamptz not null default now()
);

-- ============================================================
-- VISIÓN ÚTIL: catálogo con stock agregado por tenant
-- ============================================================
create or replace view catalog_with_stock as
select p.*,
       jsonb_object_agg(s.branch_id, s.qty) as stock_by_branch,
       coalesce(sum(s.qty), 0)              as total_stock
from products p
left join stock s on s.product_id = p.id
group by p.id;
  category_id        text,
  subcategory        text,
  price              integer not null check (price >= 0),
  original_price     integer check (original_price >= 0),
  discount           integer,
  images             text[] not null default '{}',
  specs              jsonb not null default '{}',
  tags               text[] not null default '{}',
  sec_certified      boolean not null default false,
  warranty           text,
  tier_prices        jsonb not null default '[]',
  rating             numeric(2,1) not null default 4.5,
  review_count       integer not null default 0,
  sold_count         integer not null default 0,
  is_flash_sale      boolean not null default false,
  is_b2b             boolean not null default false,
-- ============================================================
-- ROW LEVEL SECURITY — el aislamiento entre ANSES / clientes
-- Regla: solo los usuarios cuyo profile pertenece al tenant pueden
-- ver/escribir sus datos. owner/admin pueden escribir; staff lee.
-- ============================================================

-- Helper: tenant_id del usuario autenticado
create or replace function current_tenant_id() returns uuid
language sql stable as $$
  select tenant_id from profiles where id = auth.uid()
$$;

-- Helper: ¿el usuario tiene rol de escritura (owner|admin)?
create or replace function is_tenant_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('owner','admin')
  );
$$;

alter table tenants   enable row level security;
alter table branches  enable row level security;
alter table profiles  enable row level security;
alter table products  enable row level security;
alter table stock     enable row level security;
alter table orders    enable row level security;
alter table posts     enable row level security;

-- tenants: cada usuario lee solo su empresa
create policy "tenants_select_own"
  on tenants for select using (id = current_tenant_id());

-- branches: miembros del tenant (staff de cualquier sucursal)
create policy "branches_select_tenant"
  on branches for select using (tenant_id = current_tenant_id());
create policy "branches_write_tenant"
  on branches for all using (
    tenant_id = current_tenant_id() and is_tenant_admin()
  );

-- profiles: lee su perfil; admin del tenant lee los del mismo tenant
create policy "profiles_select_self"
  on profiles for select using (id = auth.uid());
create policy "profiles_select_tenant_admin"
  on profiles for select using (
    tenant_id = current_tenant_id() and is_tenant_admin()
  );
create policy "profiles_write_self"
  on profiles for update using (id = auth.uid());
create policy "profiles_insert_self"
  on profiles for insert with check (id = auth.uid());

-- products: lectura por tenant (catálogo público del tenant);
-- escritura solo owner/admin del tenant
create policy "products_select_tenant"
  on products for select using (tenant_id = current_tenant_id());
create policy "products_write_tenant"
  on products for all using (
    tenant_id = current_tenant_id() and is_tenant_admin()
  );

-- stock: lectura por tenant; escritura admin/owner; el staff puede
-- actualizar el stock de SU sucursal (encargado)
create policy "stock_select_tenant"
  on stock for select using (tenant_id = current_tenant_id());
create policy "stock_write_admin"
  on stock for all using (
    tenant_id = current_tenant_id() and is_tenant_admin()
  );
create policy "stock_write_branch_staff"
  on stock for update using (
    tenant_id = current_tenant_id()
    and branch_id in (
      select branch_id from profiles
      where id = auth.uid() and role in ('admin','staff')
    )
  );

-- orders: lectura por tenant; escritura por tenant (checkout server-side usa service role)
create policy "orders_select_tenant"
  on orders for select using (tenant_id = current_tenant_id());
create policy "orders_write_tenant"
  on orders for all using (
    tenant_id = current_tenant_id() and is_tenant_admin()
  );

-- posts: control del tenant
create policy "posts_select_tenant"
  on posts for select using (tenant_id = current_tenant_id());
create policy "posts_write_tenant"
  on posts for all using (
    tenant_id = current_tenant_id() and is_tenant_admin()
  );

-- ============================================================
-- SEED (opcional) — cliente demo para pruebas locales
-- Uso típico: insertar tenant, sucursales y 2-3 productos.
-- ============================================================
-- insert into tenants (slug, name, domain) values ('ferreteria-martinez', 'Ferretería Martínez', 'ferreteriamartinez.cl');
-- insert into branches (tenant_id, name, region, comuna, is_pickup)
--   select id, 'Sucursal Centro', 'RM', 'Santiago', true from tenants where slug = 'ferreteria-martinez';
  is_featured        boolean not null default false,
  is_best_seller     boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (tenant_id, sku)
);
create index idx_products_tenant on products(tenant_id);
create index idx_products_tenant_cat on products(tenant_id, category_id);