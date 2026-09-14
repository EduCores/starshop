import type { DataProvider, OrderStatus, OrderSaveOptions, StoredOrder, TenantContext } from "./provider";
import type { Order, Product } from "@/types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Adaptador SUPABASE — proveedor multi-tenant (white-label por cliente).
 * Mapea 1:1 las tablas de supabase/schema.sql. Requiere env:
 *   DATA_PROVIDER=supabase
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   STARSHOP_TENANT_ID  (el tenant del cliente que sirve este deploy)
 *
 * El checkout escribe desde el servidor con service role (bypass RLS);
 * el panel admin usa el SDK del cliente con RLS para aislar tenants.
 */
export function createSupabaseProvider(url: string, serviceKey: string, tenantId: string): DataProvider {
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });

  return {
    name: "supabase",

    catalog: {
      list: async (ctx: TenantContext) => {
        const tid = await resolveTenantId(client, tenantId, ctx.tenantId);
        const { data, error } = await client
          .from("products")
          .select("*")
          .eq("tenant_id", tid)
          .eq("active", true)
          .order("is_featured", { ascending: false });
        if (error) throw error;
        return (data ?? []).map(mapProduct);
      },
      get: async (ctx: TenantContext, id: string) => {
        const tid = await resolveTenantId(client, tenantId, ctx.tenantId);
        const { data, error } = await client
          .from("products")
          .select("*")
          .eq("tenant_id", tid)
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        return data ? mapProduct(data) : undefined;
      },
    },

    orders: {
      save: async (order: Order, opts?: OrderSaveOptions): Promise<StoredOrder> => {
        const tid = await resolveTenantId(client, tenantId);
        const { data, error } = await client
          .from("orders")
          .insert({
            tenant_id: tid,
            order_id: order.orderId,
            customer: order.customer,
            items: order.items,
            subtotal: order.subtotal,
            shipping_cost: order.shippingCost,
            grand_total: order.grandTotal,
            payment_method: order.paymentMethod,
            payment_status: "pending",
            gateway_ref: opts?.gatewayRef ?? order.orderId.replace("#ORD-", "ORD"),
            region: order.region,
            comuna: order.comuna,
          })
          .select()
          .single();
        if (error) throw error;
        return mapOrder(data);
      },
      findById: async (orderId: string): Promise<StoredOrder | undefined> => {
        const tid = await resolveTenantId(client, tenantId);
        const norm = orderId.startsWith("#") ? orderId : `#${orderId}`;
        const { data, error } = await client
          .from("orders")
          .select("*")
          .eq("tenant_id", tid)
          .in("order_id", [orderId, norm])
          .maybeSingle();
        if (error) throw error;
        return data ? mapOrder(data) : undefined;
      },
      findByExternalRef: async (ref: string): Promise<StoredOrder | undefined> => {
        const tid = await resolveTenantId(client, tenantId);
        const { data, error } = await client
          .from("orders")
          .select("*")
          .eq("tenant_id", tid)
          .eq("gateway_ref", ref)
          .maybeSingle();
        if (error) throw error;
        return data ? mapOrder(data) : undefined;
      },
      updateStatus: async (orderId: string, status: OrderStatus): Promise<StoredOrder | undefined> => {
        const tid = await resolveTenantId(client, tenantId);
        const { data, error } = await client
          .from("orders")
          .update({ payment_status: status })
          .eq("tenant_id", tid)
          .eq("order_id", orderId)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data ? mapOrder(data) : undefined;
      },
      count: async (): Promise<number> => {
        const tid = await resolveTenantId(client, tenantId);
        const { count, error } = await client
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tid);
        if (error) throw error;
        return count ?? 0;
      },
    },
  };
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resuelve el tenant pedido (?tenant= o STARSHOP_TENANT_ID) a su uuid.
 * Acepta uuid directo o slug (busca en `tenants`). "local" cae al default.
 * Sin esto, un STARSHOP_TENANT_ID con slug romperia el filtro/FK (uuid).
 */
async function resolveTenantId(
  client: SupabaseClient,
  defaultTenant: string,
  requested?: string,
): Promise<string> {
  const want = requested && requested !== "local" ? requested : defaultTenant;
  if (UUID_RE.test(want)) return want;
  const { data, error } = await client.from("tenants").select("id").eq("slug", want).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Tenant desconocido: "${want}" (no existe ese slug en public.tenants)`);
  return String((data as { id: string }).id);
}

/** Fila `products` (o vista catalog_with_stock) -> dominio Product. */
function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    sku: String(row.sku),
    name: String(row.name),
    slug: String(row.slug ?? row.sku),
    description: String(row.description ?? ""),
    shortDescription: String(row.short_description ?? row.name),
    categoryId: String(row.category_id ?? "") as Product["categoryId"],
    subcategory: String(row.subcategory ?? ""),
    brand: String(row.brand ?? ""),
    images: (row.images as string[]) ?? [],
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    discount: row.discount != null ? Number(row.discount) : undefined,
    rating: Number(row.rating ?? 4.5),
    reviewCount: Number(row.review_count ?? 0),
    stock: Number((row as Record<string, unknown>).total_stock ?? 0),
    soldCount: Number(row.sold_count ?? 0),
    isFlashSale: Boolean(row.is_flash_sale),
    isB2B: Boolean(row.is_b2b),
    isFeatured: Boolean(row.is_featured),
    isBestSeller: Boolean(row.is_best_seller),
    secCertified: Boolean(row.sec_certified),
    warranty: String(row.warranty ?? "1 año"),
    specs: (row.specs as Record<string, string>) ?? {},
    tierPrices: typeof row.tier_prices === "string"
      ? (JSON.parse(row.tier_prices) as Product["tierPrices"])
      : (row.tier_prices as Product["tierPrices"]),
    shippingWeight: 1,
    tags: (row.tags as string[]) ?? [],
  };
}

/** Fila `orders` -> dominio StoredOrder. */
function mapOrder(row: Record<string, unknown>): StoredOrder {
  const customer = (row.customer as Order["customer"]) ?? {};
  return {
    orderId: String(row.order_id),
    items: (row.items as Order["items"]) ?? [],
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost ?? 0),
    grandTotal: Number(row.grand_total),
    paymentMethod: String(row.payment_method) as Order["paymentMethod"],
    region: String(row.region ?? ""),
    comuna: String(row.comuna ?? ""),
    customer,
    estimatedDays: "1-2 días",
    createdAt: String(row.created_at),
    status: String(row.payment_status) as OrderStatus,
    gateway: String(row.payment_method),
    gatewayRef: String(row.gateway_ref ?? ""),
  };
}