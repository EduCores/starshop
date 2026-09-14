/**
 * Genera supabase/seed-catalog.sql desde src/lib/mock-data.ts (49 productos demo).
 * Uso:  npx tsx scripts/seed-catalog.ts [slug]   (default: "seed-store")
 * Luego: pegar el SQL en el SQL editor de Supabase (o psql). Idempotente:
 * se puede re-ejecutar sin duplicar (upsert por (tenant_id, sku)).
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../src/lib/mock-data";

const slug = process.argv[2] ?? "seed-store";
const esc = (v: string) => `'${v.replace(/'/g, "''")}'`;
const arr = (xs: string[]) =>
  xs.length ? `ARRAY[${xs.map(esc).join(",")}]::text[]` : `'{}'::text[]`;
const js = (v: unknown) => `${esc(JSON.stringify(v ?? {}))}::jsonb`;
const ni = (v: number | undefined) => (v == null ? "null" : String(Math.round(v)));
const b = (v: unknown) => (v ? "true" : "false");
const T = `(select id from tenants where slug = ${esc(slug)})`;
const B = (name: string) =>
  `(select b.id from branches b join tenants t on t.id = b.tenant_id where t.slug = ${esc(slug)} and b.name = ${esc(name)})`;
const P = (sku: string) =>
  `(select p.id from products p join tenants t on t.id = p.tenant_id where t.slug = ${esc(slug)} and p.sku = ${esc(sku)})`;

const UPD = [
  "name", "slug", "description", "short_description", "brand", "category_id",
  "subcategory", "price", "original_price", "discount", "images", "specs", "tags",
  "sec_certified", "warranty", "tier_prices", "rating", "review_count",
  "sold_count", "is_flash_sale", "is_b2b", "is_featured", "is_best_seller", "active",
].map((c) => `${c} = excluded.${c}`).join(", ");

const out: string[] = [
  `-- SEED catalogo demo — tenant ${esc(slug)} — generado desde src/lib/mock-data.ts`,
  `-- Re-ejecutable (upsert). Requiere supabase/schema.sql aplicado.`,
  ``,
  `insert into tenants (slug, name, plan) values (${esc(slug)}, 'StarShop Demo', 'starter')`,
  `  on conflict (slug) do nothing;`,
  ``,
  `insert into branches (tenant_id, name, region, comuna)`,
  `select id, 'Sucursal Centro', 'RM', 'Santiago' from tenants where slug = ${esc(slug)}`,
  `and not exists (select 1 from branches b join tenants t on t.id = b.tenant_id where t.slug = ${esc(slug)} and b.name = 'Sucursal Centro');`,
  `insert into branches (tenant_id, name, region, comuna)`,
  `select id, 'Sucursal Norte', 'RM', 'Quilicura' from tenants where slug = ${esc(slug)}`,
  `and not exists (select 1 from branches b join tenants t on t.id = b.tenant_id where t.slug = ${esc(slug)} and b.name = 'Sucursal Norte');`,
  ``,
];

for (const p of products) {
  out.push(
    `insert into products (tenant_id, sku, name, slug, description, short_description, brand, category_id, subcategory, price, original_price, discount, images, specs, tags, sec_certified, warranty, tier_prices, rating, review_count, sold_count, is_flash_sale, is_b2b, is_featured, is_best_seller, active)`,
    `values (${T}, ${esc(p.sku)}, ${esc(p.name)}, ${esc(p.slug)}, ${esc(p.description)}, ${esc(p.shortDescription)}, ${esc(p.brand)}, ${esc(p.categoryId)}, ${esc(p.subcategory)}, ${Math.round(p.price)}, ${ni(p.originalPrice)}, ${ni(p.discount)}, ${arr(p.images)}, ${js(p.specs)}, ${arr(p.tags)}, ${b(p.secCertified)}, ${esc(p.warranty)}, ${js(p.tierPrices ?? [])}, ${p.rating ?? 4.5}, ${p.reviewCount ?? 0}, ${p.soldCount ?? 0}, ${b(p.isFlashSale)}, ${b(p.isB2B)}, ${b(p.isFeatured)}, ${b(p.isBestSeller)}, true)`,
    `on conflict (tenant_id, sku) do update set ${UPD};`,
  );
  const centro = Math.round((p.stock ?? 0) * 0.7);
  const norte = (p.stock ?? 0) - centro;
  out.push(
    `insert into stock (tenant_id, branch_id, product_id, qty) values (${T}, ${B("Sucursal Centro")}, ${P(p.sku)}, ${centro})`,
    `  on conflict (branch_id, product_id) do update set qty = excluded.qty;`,
    `insert into stock (tenant_id, branch_id, product_id, qty) values (${T}, ${B("Sucursal Norte")}, ${P(p.sku)}, ${norte})`,
    `  on conflict (branch_id, product_id) do update set qty = excluded.qty;`,
  );
}

const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "seed-catalog.sql");
writeFileSync(dest, out.join("\n") + "\n", "utf-8");
console.log(`OK: ${products.length} productos -> ${dest}`);
