"""Valida supabase/schema.sql ignorando comentarios, strings y cuerpos $$."""
import re
from pathlib import Path

raw = Path("supabase/schema.sql").read_text(encoding="utf-8")
no_comments = re.sub(r"--.*", "", raw)
no_strings = re.sub(r"'(?:[^']|'')*'", "''", no_comments)
code = re.sub(r"\$\$.*?\$\$", "$$", no_strings, flags=re.S)

o, c = code.count("("), code.count(")")
print("parentesis (codigo real):", o, c, "->", "OK" if o == c else "ROTO")

tables = re.findall(r"create table (\w+)", raw)
print("tablas:", tables)
ok = True
for t in tables:
    m = re.search(r"create table %s \(.*?\n\);" % t, raw, re.S)
    print(f"  {t}: {'cierra OK' if m else 'SIN CIERRE <-- ROTO'}")
    ok = ok and bool(m)
print("politicas RLS:", len(re.findall(r"create policy", raw)))
print("vista catalog_with_stock:", "catalog_with_stock" in raw,
      "| antes de RLS:", raw.index("catalog_with_stock") < raw.index("ROW LEVEL SECURITY"))
print("indices products:", raw.count("idx_products_tenant"))
print("RESULTADO:", "SCHEMA OK" if (ok and o == c) else "SCHEMA ROTO")
