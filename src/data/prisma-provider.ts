import type { DataProvider, OrderStatus, OrderSaveOptions, StoredOrder, TenantContext } from "./provider";
import type { Order, Product } from "@/types";
import { prisma } from "@/lib/prisma";

/**
 * Adaptador PRISMA — misma DB Postgres que Supabase (supabase/schema.sql),
 * pero con Prisma Client en vez de supabase-js. Alternativa 1:1 al adaptador
 * de Supabase: mismo modelo (ver prisma/schema.prisma), misma resolucion de
 * tenant (slug o uuid), mismo contrato (DataProvider).
 *
 * Requiere env:
 *   DATA_PROVIDER=prisma
 *   DATABASE_URL  (pooler Supabase, puerto 6543) + DIRECT_URL (puerto 5432)
 *   STARSHOP_TENANT_ID (slug o uuid del tenant de este deploy)
 *
 * El checkout escribe con Prisma directo (equivale al service role: bypass RLS
 * porque Prisma no pasa por PostgREST). El panel admin futuro puede usar RLS.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveTenantId(defaultTenant: string, requested?: string): Promise<string> {
  const want = requested && requested !== "local" ? requested : defaultTenant;
  if (UUID_RE.test(want)) return want;
  const tenant = await prisma.tenant.findUnique({ where: { slug: want }, select: { id: true } });
  if (!tenant) throw new Error(`Tenant desconocido: "${want}" (no existe ese slug en public.tenants)`);
  return tenant.id;
}

type PrismaProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string | null;
  description: string | null;
  shortDescription: string | null;
  brand: string | null;
  categoryId: string | null;
  subcategory: string | null;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  images: string[];
  specs: unknown;
  tags: string[];
  secCertified: boolean;
  warranty: string | null;
  tierPrices: unknown;
  rating: { toNumber(): number } | number;
  reviewCount: number;
  soldCount: number;
  isFlashSale: boolean;
  isB2B: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  stocks?: { qty: number }[];
};

function mapProduct(row: PrismaProductRow): Product {
  const stock = Array.isArray(row.stocks)
    ? row.stocks.reduce((acc, s) => acc + (s.qty ?? 0), 0)
    : 0;
  const rating = typeof row.rating === "number" ? row.rating : row.rating.toNumber();
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug ?? row.sku,
    description: row.description ?? "",
    shortDescription: row.shortDescription ?? row.name,
    categoryId: (row.categoryId ?? "") as Product["categoryId"],
    subcategory: row.subcategory ?? "",
    brand: row.brand ?? "",
    images: row.images ?? [],
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    discount: row.discount ?? undefined,
    rating: rating ?? 4.5,
    reviewCount: row.reviewCount ?? 0,
    stock,
    soldCount: row.soldCount ?? 0,
    isFlashSale: row.isFlashSale,
    isB2B: row.isB2B,
    isFeatured: row.isFeatured,
    isBestSeller: row.isBestSeller,
    secCertified: row.secCertified,
    warranty: row.warranty ?? "1 año",
    specs: (row.specs as Record<string, string>) ?? {},
    tierPrices: (row.tierPrices as Product["tierPrices"]) ?? [],
    shippingWeight: 1,
    tags: row.tags ?? [],
  };
}

type PrismaOrderRow = {
  orderId: string;
  items: unknown;
  subtotal: number;
  shippingCost: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  gatewayRef: string | null;
  region: string | null;
  comuna: string | null;
  customer: unknown;
  createdAt: Date;
};

function mapOrder(row: PrismaOrderRow): StoredOrder {
  const customer = (row.customer as Order["customer"]) ?? ({} as Order["customer"]);
  return {
    orderId: row.orderId,
    items: (row.items as Order["items"]) ?? [],
    subtotal: row.subtotal,
    shippingCost: row.shippingCost ?? 0,
    grandTotal: row.grandTotal,
    paymentMethod: row.paymentMethod as Order["paymentMethod"],
    region: row.region ?? "",
    comuna: row.comuna ?? "",
    customer,
    estimatedDays: "1-2 días",
    createdAt: row.createdAt.toISOString(),
    status: row.paymentStatus as OrderStatus,
    gateway: row.paymentMethod,
    gatewayRef: row.gatewayRef ?? "",
  };
}

/** Crea el provider Prisma para el tenant por defecto de este deploy. */
export function createPrismaProvider(defaultTenant: string): DataProvider {
  return {
    name: "prisma",

    catalog: {
      list: async (ctx: TenantContext) => {
        const tid = await resolveTenantId(defaultTenant, ctx.tenantId);
        const rows = await prisma.product.findMany({
          where: { tenantId: tid, active: true },
          include: { stocks: { select: { qty: true } } },
          orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        });
        return rows.map((r) => mapProduct(r as unknown as PrismaProductRow));
      },
      get: async (ctx: TenantContext, id: string) => {
        const tid = await resolveTenantId(defaultTenant, ctx.tenantId);
        // La tienda navega por id, pero tambien aceptamos sku/slug (como local).
        const ors: never[] = [{ sku: id }, { slug: id }] as never[];
        if (UUID_RE.test(id)) ors.unshift({ id } as never);
        const row = await prisma.product.findFirst({
          where: { tenantId: tid, OR: ors },
          include: { stocks: { select: { qty: true } } },
        });
        return row ? mapProduct(row as unknown as PrismaProductRow) : undefined;
      },
    },

    orders: {
      save: async (order: Order, opts?: OrderSaveOptions): Promise<StoredOrder> => {
        const tid = await resolveTenantId(defaultTenant);
        const row = await prisma.order.create({
          data: {
            tenantId: tid,
            orderId: order.orderId,
            customer: order.customer as never,
            items: order.items as never,
            subtotal: Math.round(order.subtotal),
            shippingCost: Math.round(order.shippingCost ?? 0),
            grandTotal: Math.round(order.grandTotal),
            paymentMethod: order.paymentMethod,
            paymentStatus: "pending",
            gatewayRef: opts?.gatewayRef ?? order.orderId.replace("#ORD-", "ORD"),
            region: order.region,
            comuna: order.comuna,
          },
        });
        return mapOrder(row as unknown as PrismaOrderRow);
      },
      findById: async (orderId: string): Promise<StoredOrder | undefined> => {
        const tid = await resolveTenantId(defaultTenant);
        const norm = orderId.startsWith("#") ? orderId : `#${orderId}`;
        const row = await prisma.order.findFirst({
          where: { tenantId: tid, orderId: { in: [orderId, norm] } },
        });
        return row ? mapOrder(row as unknown as PrismaOrderRow) : undefined;
      },
      findByExternalRef: async (ref: string): Promise<StoredOrder | undefined> => {
        const tid = await resolveTenantId(defaultTenant);
        const row = await prisma.order.findFirst({
          where: { tenantId: tid, gatewayRef: ref },
        });
        return row ? mapOrder(row as unknown as PrismaOrderRow) : undefined;
      },
      updateStatus: async (orderId: string, status: OrderStatus): Promise<StoredOrder | undefined> => {
        const tid = await resolveTenantId(defaultTenant);
        const norm = orderId.startsWith("#") ? orderId : `#${orderId}`;
        const existing = await prisma.order.findFirst({
          where: { tenantId: tid, orderId: { in: [orderId, norm] } },
          select: { id: true },
        });
        if (!existing) return undefined;
        const row = await prisma.order.update({
          where: { id: existing.id },
          data: { paymentStatus: status },
        });
        return mapOrder(row as unknown as PrismaOrderRow);
      },
      count: async (): Promise<number> => {
        const tid = await resolveTenantId(defaultTenant);
        return prisma.order.count({ where: { tenantId: tid } });
      },
    },
  };
}
