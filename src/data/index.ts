import type { DataProvider, OrderStatus, OrderSaveOptions, StoredOrder, TenantContext } from "./provider";
import type { Order, Product } from "@/types";
import { localProvider } from "./local";
import { createSupabaseProvider } from "./supabase";
import { createPrismaProvider } from "./prisma-provider";

/**
 * Fábrica de providers: la app habla SIEMPRE con `db` (esta interfaz),
 * nunca con SDKs concretos. Así, elegir otra base de datos para otro
 * proyecto (Neon/Prisma, Turso, SQLite en Railway...) = implementar la
 * interfaz y cambiar una variable de entorno. Cero cambios en la UI.
 *
 *   DATA_PROVIDER=local     (default; demo sin infraestructura)
 *   DATA_PROVIDER=supabase  (requiere SUPABASE_URL + SERVICE KEY + TENANT)
 *   DATA_PROVIDER=prisma    (requiere DATABASE_URL + DIRECT_URL + TENANT;
 *                            mismo Postgres de Supabase vía Prisma Client)
 */
export function resolveProvider(): DataProvider {
  const name = (process.env.DATA_PROVIDER ?? "local").toLowerCase();
  if (name === "supabase") {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tenant = process.env.STARSHOP_TENANT_ID;
    if (!url || !key || !tenant) {
      throw new Error("DATA_PROVIDER=supabase requiere SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y STARSHOP_TENANT_ID");
    }
    return createSupabaseProvider(url, key, tenant);
  }
  if (name === "prisma") {
    const tenant = process.env.STARSHOP_TENANT_ID;
    if (!process.env.DATABASE_URL || !tenant) {
      throw new Error("DATA_PROVIDER=prisma requiere DATABASE_URL y STARSHOP_TENANT_ID (DIRECT_URL solo para migraciones)");
    }
    return createPrismaProvider(tenant);
  }
  return localProvider;
}
/** Provider único de la aplicación (lazy: no choca si falta env local). */
let _db: DataProvider | null = null;
export function getDb(): DataProvider {
  // En build estático de Next (generateStaticParams / collect page data) no hay
  // env de runtime todavía: devolver el provider local es seguro porque esas
  // páginas solo leen el catálogo (mock-data), nunca escriben órdenes.
  // En runtime (dev/serverless) se resuelve el provider real una sola vez.
  if (typeof process !== "undefined" && process.env.NEXT_PHASE === "phase-production-build" && !_db) {
    return localProvider;
  }
  if (!_db) _db = resolveProvider();
  return _db;
}

/** Proxy perezoso: `db` nunca resuelve el provider en import-time (build-safe). */
export const db: DataProvider = new Proxy({} as DataProvider, {
  get(_target, prop: keyof DataProvider) {
    const real = getDb() as unknown as Record<string, unknown>;
    const value = real[prop as string];
    return typeof value === "function" ? (value as (...a: never[]) => unknown).bind(real) : value;
  },
});
export { localProvider, createSupabaseProvider, createPrismaProvider };
export type { DataProvider, OrderStatus, StoredOrder, TenantContext } from "./provider";