import type { Order, Product } from "@/types";

/**
 * Tipos compartidos de la capa de datos (agnósticos del proveedor).
 * El modelo de negocio (dominio) NO debe importar SDKs de bases de datos:
 * solo estas interfaces y las que están en @/types.
 */

export type DataProviderName = "local" | "supabase" | "prisma";

export type OrderStatus = "pending" | "approved" | "rejected" | "failed";

export interface StoredOrder extends Order {
  status: OrderStatus;
  gateway: string;     // webpay | mercadopago | transferencia
  gatewayRef: string;  // buy_order (Webpay) / external_reference (MP)
  updatedAt?: string;
}

export interface OrderSaveOptions {
  gateway?: string;
  gatewayRef?: string;
}

export interface TenantContext {
  tenantId: string;
}

/**
 * PUERTO de datos. TODO el código de la app habla solo con esta interfaz.
 * Cambiar de proveedor (Supabase -> Neon -> Prisma -> Turso -> SQLite)
 * implica implementar esta interfaz de nuevo — nada más.
 */
export interface DataProvider {
  readonly name: DataProviderName;

  /** Catálogo de productos (hoy vendría de la DB del tenant). */
  catalog: {
    list(tenant: TenantContext): Promise<Product[]>;
    get(tenant: TenantContext, id: string): Promise<Product | undefined>;
  };

  /** Órdenes (hoy data/orders.json; mañana tabla `orders`). */
  orders: {
    save(order: Order, opts?: OrderSaveOptions): Promise<StoredOrder>;
    findById(orderId: string): Promise<StoredOrder | undefined>;
    findByExternalRef(ref: string): Promise<StoredOrder | undefined>;
    updateStatus(orderId: string, status: OrderStatus): Promise<StoredOrder | undefined>;
    count(): Promise<number>;
  };
}