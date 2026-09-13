import fs from "fs";
import path from "path";
import type { Order } from "@/types";

export type OrderStatus = "pending" | "approved" | "rejected" | "failed";

export interface StoredOrder extends Order {
  status: OrderStatus;
  gateway: string; // webpay | mercadopago | transferencia
  gatewayRef: string; // buy_order (Webpay) / external_reference (MercadoPago)
  updatedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf-8");
}

export function getAllOrders(): StoredOrder[] {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function externalRefFor(orderId: string): string {
  return orderId.replace("#ORD-", "ORD");
}

export function saveOrder(
  order: Order,
  opts?: { gateway?: string; gatewayRef?: string }
): StoredOrder {
  const orders = getAllOrders();
  const stored: StoredOrder = {
    ...order,
    status: "pending",
    gateway: opts?.gateway ?? order.paymentMethod,
    gatewayRef: opts?.gatewayRef ?? externalRefFor(order.orderId),
    updatedAt: new Date().toISOString(),
  };
  const idx = orders.findIndex((o) => o.orderId === order.orderId);
  if (idx >= 0) orders[idx] = stored;
  else orders.push(stored);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  return stored;
}

export function findOrderById(orderId: string): StoredOrder | undefined {
  return getAllOrders().find(
    (o) => o.orderId === orderId || o.orderId === `#${orderId}`
  );
}

export function findOrderByExternalRef(ref: string): StoredOrder | undefined {
  return getAllOrders().find((o) => o.gatewayRef === ref);
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): StoredOrder | undefined {
  const orders = getAllOrders();
  const idx = orders.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return undefined;
  orders[idx] = { ...orders[idx], status, updatedAt: new Date().toISOString() };
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  return orders[idx];
}
