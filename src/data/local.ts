import type { DataProvider, OrderStatus, OrderSaveOptions, StoredOrder, TenantContext } from "./provider";
import type { Order, Product } from "@/types";
import { products as mockProducts } from "@/lib/mock-data";
import * as fileOrders from "@/lib/orders";

/**
 * Adaptador LOCAL — proveedor por defecto.
 * Usa los datos actuales del repo (mock-data + data/*.json) para que la
 * demo funcione sin instalar nada, manteniendo la MISMA interfaz que el
 * adaptador de Supabase. Es el "modo híbrido": la app no sabe cuál corre.
 */
export const localProvider: DataProvider = {
  name: "local",

  catalog: {
    list: async (_tenant: TenantContext) => mockProducts,
    get: async (_tenant: TenantContext, id: string) => mockProducts.find((p) => p.id === id || p.sku === id || p.slug === id),
  },

  orders: {
    save: (order: Order, opts?: OrderSaveOptions): Promise<StoredOrder> => Promise.resolve(fileOrders.saveOrder(order, opts)),
    findById: (orderId: string): Promise<StoredOrder | undefined> => Promise.resolve(fileOrders.findOrderById(orderId)),
    findByExternalRef: (ref: string): Promise<StoredOrder | undefined> => Promise.resolve(fileOrders.findOrderByExternalRef(ref)),
    updateStatus: (orderId: string, status: OrderStatus): Promise<StoredOrder | undefined> =>
      Promise.resolve(fileOrders.updateOrderStatus(orderId, status)),
    count: (): Promise<number> => Promise.resolve(fileOrders.getAllOrders().length),
  },
};