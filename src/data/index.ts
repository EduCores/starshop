import type { DataProvider } from "./provider";
import { localProvider } from "./local";
import { createSupabaseProvider } from "./supabase";

/**
 * Fábrica de providers: la app habla SIEMPRE con `db` (esta interfaz),
 * nunca con SDKs concretos. Así, elegir otra base de datos para otro
 * proyecto (Neon/Prisma, Turso, SQLite en Railway...) = implementar la
 * interfaz y cambiar una variable de entorno. Cero cambios en la UI.
 *
 *   DATA_PROVIDER=local     (default; demo sin infraestructura)
 *   DATA_PROVIDER=supabase  (requiere SUPABASE_URL + SERVICE KEY + TENANT)
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
  return localProvider;
}

/** Provider único de la aplicación (lazy: no choca si falta env local). */
let _db: DataProvider | null = null;
export function getDb(): DataProvider {
  if (!_db) _db = resolveProvider();
  return _db;
}

export const db = getDb();
export { localProvider, createSupabaseProvider };
export type { DataProvider, OrderStatus, StoredOrder, TenantContext } from "./provider";