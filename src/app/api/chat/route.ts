import { NextRequest, NextResponse } from "next/server";
import { products, superCategories } from "@/lib/mock-data";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const catMap = Object.fromEntries(superCategories.map(c => [c.id, c.name]));

// --- Embeddings (RAG vector) ---
let productEmbeddings: Record<string, number[]> | null = null;
let embeddingsLoaded = false;

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i=0;i<a.length;i++) { dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-9);
}

async function getEmbedding(text: string, apiKey: string, isOpenRouter: boolean): Promise<number[] | null> {
  try {
    const endpoint = isOpenRouter ? "https://openrouter.ai/api/v1/embeddings" : "https://api.openai.com/v1/embeddings";
    const model = isOpenRouter ? (process.env.OPENROUTER_EMBED_MODEL || "openai/text-embedding-3-small") : (process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small");
    const headers: Record<string,string> = { "Content-Type":"application/json", "Authorization":`Bearer ${apiKey}` };
    if (isOpenRouter) { headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://demostarshop.vercel.app"; headers["X-Title"]="Starshop Embeddings"; }
    const r = await fetch(endpoint, { method:"POST", headers, body: JSON.stringify({ model, input: text }) });
    if (!r.ok) { console.warn("[embed] error", r.status, await r.text().then(t=>t.slice(0,200))); return null; }
    const j = await r.json();
    return j.data?.[0]?.embedding || null;
  } catch(e){ console.warn("[embed] fetch fail", e); return null; }
}

function loadEmbeddingsFromFile(): Record<string, number[]> | null {
  if (embeddingsLoaded) return productEmbeddings;
  embeddingsLoaded = true;
  try {
    const p1 = path.join(process.cwd(), "data", "productos-embeddings.json");
    const p2 = path.join(process.cwd(), "public", "productos-embeddings.json");
    const file = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : null;
    if (file) {
      const j = JSON.parse(fs.readFileSync(file, "utf-8"));
      productEmbeddings = j;
      console.log(`[embed] loaded ${Object.keys(j).length} vectors from ${file}`);
      return j;
    }
  } catch(e){ console.warn("[embed] load fail", e); }
  return null;
}

function productText(p:any): string {
  return `${p.name} ${p.shortDescription} ${p.description} ${p.brand} ${catMap[p.categoryId]} ${p.subcategory} ${(p.tags||[]).join(" ")} ${Object.entries(p.specs||{}).map(([k,v])=>`${k} ${v}`).join(" ")}`.slice(0,8000);
}

// Normaliza: minúsculas y sin acentos (para que "amperimetro" matchee "Amperímetro")
function normalizeAccents(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// --- Retrieval simple (keywords + filtros) - mismo que scripts/probar-agente.mjs ---
function scoreProduct(p: any, query: string) {
  const q = normalizeAccents(query);
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;
  const haystack = normalizeAccents([p.name, p.description, p.shortDescription, p.brand, catMap[p.categoryId], p.subcategory, (p.tags||[]).join(" "), Object.values(p.specs||{}).join(" ")].join(" "));
  for (const t of tokens) {
    if (haystack.includes(t)) score += 2;
    if (normalizeAccents(String(p.name)).includes(t)) score += 3;
    if (normalizeAccents((p.tags||[]).join(" ")).includes(t)) score += 2;
  }
  if (q.includes("sec") && p.secCertified) score += 5;
  if (q.includes("bestseller") && p.isBestSeller) score += 4;
  if (q.includes("flash") && p.isFlashSale) score += 4;
  if (q.includes("b2b") && p.isB2B) score += 3;
  const mPrecio = q.match(/(?:bajo|menos de|menor|<)\s*\$?\s*([\d\.]+)/i);
  if (mPrecio) {
    const max = parseInt(mPrecio[1].replace(/\./g, ""));
    if (p.price <= max) score += 4; else score -= 10;
  }
  const mEntre = q.match(/entre\s*\$?\s*([\d\.]+)\s*y\s*\$?\s*([\d\.]+)/i);
  if (mEntre) {
    const a = parseInt(mEntre[1].replace(/\./g, "")), b = parseInt(mEntre[2].replace(/\./g, ""));
    if (p.price >= Math.min(a,b) && p.price <= Math.max(a,b)) score += 4; else score -= 8;
  }
  return score;
}

function getTopProducts(query: string, k = 5) {
  const scored = products.map(p => ({ p, s: scoreProduct(p, query) })).sort((a,b)=> (b.s as number) - (a.s as number));
  const top = scored.filter(x=>x.s>0).slice(0,k);
  if (top.length===0) return products.filter(p=>p.isBestSeller).slice(0,3).map(p=>({p, s:1}));
  return top;
}

// Versión con embeddings (híbrida: 0.6 vector + 0.4 keyword)
async function getTopProductsHybrid(query: string, k = 5, apiKey?: string, isOpenRouter?: boolean): Promise<{p:any,s:number,vecScore?:number}[]> {
  const keywordScored = products.map(p => ({ p, s: scoreProduct(p, query) }));
  const maxKw = Math.max(...keywordScored.map(x=>x.s), 1);
  // Intenta vector
  let vecScores: Map<string, number> | null = null;
  if (apiKey) {
    const fileEmbeds = loadEmbeddingsFromFile();
    if (fileEmbeds) {
      const qEmb = await getEmbedding(query, apiKey, !!isOpenRouter);
      if (qEmb) {
        vecScores = new Map();
        for (const p of products) {
          const pe = fileEmbeds[p.id];
          if (pe) vecScores.set(p.id, cosine(qEmb, pe));
        }
      }
    }
  }
  if (vecScores) {
    const hybrid = keywordScored.map(({p,s}) => {
      const v = vecScores!.get(p.id) ?? 0;
      // normaliza keyword a 0-1 y mezcla
      const kwNorm = s / maxKw;
      const hybridScore = 0.6 * v + 0.4 * kwNorm + (s>=6?0.1:0); // boost si keyword ya era fuerte
      return { p, s: hybridScore, vecScore: v };
    }).sort((a,b)=>b.s-a.s).slice(0,k);
    // si el híbrido da scores muy bajos (<0.15) fallback a keyword
    if (hybrid[0].s < 0.15) return getTopProducts(query, k);
    return hybrid;
  }
  return getTopProducts(query, k);
}

function formatContext(top: {p:any,s:number}[]) {
  return top.map(({p,s}) => 
    `- ${p.name} | SKU:${p.sku} | Marca:${p.brand} | $${p.price.toLocaleString("es-CL")} ${p.discount?`(-${p.discount}%)`:``} | ${catMap[p.categoryId]} > ${p.subcategory} | Stock:${p.stock} | SEC:${p.secCertified?"SÍ":"NO"} | Rating:${p.rating} | URL:/producto/${p.slug} | Specs:${Object.entries(p.specs||{}).map(([k,v])=>`${k}:${v}`).join(", ")}`
  ).join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { message, agentSlug, storeId } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Falta message" }, { status: 400 });
    }

    const openRouterKeyEarly = process.env.OPENROUTER_API_KEY;
    const openAiKeyEarly = process.env.OPENAI_API_KEY;
    const apiKeyEarly = openRouterKeyEarly || openAiKeyEarly;
    const isOpenRouterEarly = !!openRouterKeyEarly;

    // Usa híbrido con embeddings si hay key y embeddings file, sino keyword
    const top = apiKeyEarly ? await getTopProductsHybrid(message, 5, apiKeyEarly, isOpenRouterEarly) : getTopProducts(message, 5);
    const context = formatContext(top);
    const best = top[0]?.p;

    // --- Detección de navegación automática ---
    // 1) Si es búsqueda genérica de categoría/subcategoría -> navega a /categoria/[slug]
    // 2) Si es match específico de producto -> navega a /producto/[slug] automáticamente
    const toolCalls: any[] = [];
    const qLower = message.toLowerCase().trim();
    const qNorm = normalizeAccents(qLower);
    // SKU exacto (con o sin guiones) -> ficha del producto directo
    const skuClean = qNorm.replace(/[\s\-]/g, "");
    const skuExact = products.find((p) => normalizeAccents(p.sku).replace(/-/g, "") === skuClean);
    // Detecta si la query es genérica de categoría (ej: "proyectores", "cintas led", "multimetros")
    let categoryNav: string | null = null;
    let categoryIsSuper = false; // true si matchea el nombre de la categoría madre (ej: "iluminación"), false si es subcategoría (ej: "taladros")
    for (const cat of superCategories) {
      const catNames = [cat.name.toLowerCase(), cat.slug.toLowerCase()];
      const subNames = cat.subcategories.map(s => [s.name.toLowerCase(), s.slug.toLowerCase()]).flat();
      const matchesName = (n: string) => {
        const n2 = normalizeAccents(n);
        const base = n2.replace(/s$/,""); // singulariza simple
        return qNorm === n2 || qNorm === base || (qNorm.length <= 20 && (n2.includes(qNorm) || qNorm.includes(base)));
      };
      for (const n of catNames) {
        if (matchesName(n) && qNorm.length >= 4) {
          categoryNav = cat.slug;
          categoryIsSuper = true;
          break;
        }
      }
      if (categoryNav) break;
      for (const n of subNames) {
        if (matchesName(n) && qNorm.length >= 4) {
          categoryNav = cat.slug;
          categoryIsSuper = false;
          break;
        }
      }
      if (categoryNav) break;
    }
    // Solo navega a /categoria/[slug] si el término es la categoría madre (ej: "iluminación").
    // Si es un término tipo producto/subcategoría (ej: "taladro"), cae al /busqueda?q= de abajo:
    // así el agente lleva a la ventana con TODOS los productos que coinciden.
    const isGenericCategory = categoryNav && categoryIsSuper && qLower.split(/\s+/).length <= 3 && (!best || scoreProduct(best, message) < 8);
    if (skuExact) {
      toolCalls.push({ toolName: "navigateTo", args: { path: `/producto/${skuExact.id}` } });
    } else if (isGenericCategory) {
      toolCalls.push({ toolName: "navigateTo", args: { path: `/categoria/${categoryNav}` } });
    } else if (best && scoreProduct(best, message) >= 6 && qLower.split(/\s+/).length >= 3) {
      // Match específico de 3+ palabras (ej: "taladro percutor 20v") -> navega al producto
      toolCalls.push({ toolName: "navigateTo", args: { path: `/producto/${best.slug}` } });
    } else if (qLower.length >= 4 && !/^(hola|buenas|buenos|hey|chao|adios|gracias|ayuda|qué tienes|que tienes|qué tienen|que tienen)\b/.test(qLower)) {
      // Término genérico (ej: "taladro", "amperímetro", "taladros") -> ventana de resultados
      // global /busqueda?q= con TODOS los productos que coinciden en el catálogo
      toolCalls.push({ toolName: "navigateTo", args: { path: `/busqueda?q=${encodeURIComponent(message.trim())}` } });
    }

    // Si no hay keys de LLM, responde en modo RAG mock (sin gastar tokens) - útil para probar Excel sin OpenRouter
    const openRouterKey = openRouterKeyEarly;
    const openAiKey = openAiKeyEarly;
    const apiKey = apiKeyEarly;
    const isOpenRouter = isOpenRouterEarly;

    if (!apiKey) {
      // Mock RAG con guía por categoría + persuasión (mismo comportamiento que con LLM)
      const isVague = top.length===0 || scoreProduct(best||products[0], message) < 3 || /^(hola|buenas|qué tienen|que tienen|ayuda|hola!|buenas!)/i.test(message.trim());
      if (isVague) {
        const cats = superCategories.slice(0,5).map(c=>`• **${c.name}** (${c.slug}) — ${c.description}`).join("\n");
        const guide = `¡Hola! Soy Star ⭐ ¿Qué categoría buscas hoy?\n\n${cats}\n\nCuéntame: ¿uso hogar o industrial? ¿presupuesto aprox? ¿necesitas SEC o precio mayorista? Con eso te muestro el match exacto y te llevo directo al producto.`;
        return NextResponse.json({ text: guide, toolCalls: toolCalls.length ? toolCalls : undefined, debug: { mode: "mock-rag-guide", topIds: [] } });
      }
      // Genérica -> guía a categoría con navegación automática
      if (isGenericCategory) {
        const cat = superCategories.find(c=>c.slug===categoryNav)!;
        const subs = cat.subcategories.slice(0,4).map(s=>`• ${s.name} (${s.count} productos)`).join("\n");
        const catText = `¡Genial! Buscas **${cat.name}** 👉 te llevo a la categoría completa.\n\n${cat.description}\n\nSubcategorías destacadas:\n${subs}\n\nYa te abrí **/categoria/${cat.slug}** para que explores. ¿Quieres que filtre por precio, SEC o marca dentro de esa categoría?`;
        return NextResponse.json({ text: catText, toolCalls, debug: { mode: "mock-rag-category", topIds: [] } });
      }
      // Búsqueda genérica -> texto coherente con la navegación a /busqueda?q=
      const searchNav = toolCalls.find(t => typeof t.args?.path === "string" && t.args.path.startsWith("/busqueda"));
      if (searchNav) {
        const topText = top.slice(0,3).map(({p})=>`• ${p.name} — $${p.price.toLocaleString("es-CL")} ${p.secCertified?"SEC✅":""} → /producto/${p.slug}`).join("\n");
        const searchText = `¡Buena búsqueda! Te abrí la ventana de resultados con **todos** los productos que coinciden con "${message}" en el catálogo completo 🔎\n\nTop matches:\n${topText || "Revisa la ventana de resultados."}\n\n¿Quieres que filtre por precio, SEC o marca?`;
        return NextResponse.json({ text: searchText, toolCalls, debug: { mode: "mock-rag-search", topIds: top.map(t=>t.p.id) } });
      }
      // Match específico -> persuasivo + assertivo + navegación automática
      const p = best!;
      const persuasion = `¡Perfecto! Para "${message}" mi recomendado es **${p.name}** — $${p.price.toLocaleString("es-CL")} ${p.discount?`(ahorras ${p.discount}% de $${p.originalPrice?.toLocaleString("es-CL")})`:``} | ${catMap[p.categoryId]} > ${p.subcategory} | ${p.secCertified?"**SEC ✅ certificado**":""} | Stock:${p.stock} | Garantía:${p.warranty}\n\nSpecs: ${Object.entries(p.specs||{}).map(([k,v])=>`${k}:${v}`).join(" | ")}\n\nEs el match con mejor relación precio/calidad y despacho 24h RM. ¡Ya te abrí el detalle! 👉 /producto/${p.slug} — ¿lo agregamos al carro?`;
      const others = top.slice(1,3).map(({p})=>`• ${p.name} — $${p.price.toLocaleString("es-CL")} → /producto/${p.slug}`).join("\n");
      const full = others ? `${persuasion}\n\nAlternativas:\n${others}\n\n¿Buscamos por categoría /categoria/${p.categoryId} o cambiamos el filtro de precio/SEC?` : persuasion;
      // Navegación automática al producto final
      return NextResponse.json({ text: full, toolCalls, debug: { mode: "mock-rag-persuasive", topIds: top.map(t=>t.p.id) } });
    }

    // --- Llamada LLM con contexto RAG + tools ---
    const model = process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || (isOpenRouter ? "qwen/qwen3-30b-a3b" : "gpt-4o-mini");

    const categoriesList = superCategories.map(c => `- ${c.name} (${c.slug}): ${c.description} | sub: ${c.subcategories.map(s=>s.name).join(", ")}`).join("\n");

    const systemPrompt = `Eres Star, asistente de ventas experto de Starshop Chile (iluminación LED, herramientas, medición, seguridad, energía).
OBJETIVO: Guiar al cliente paso a paso hasta que elija una CATEGORÍA y luego un PRODUCTO concreto y pase por caja. Sé seductor y asertivo (venta consultiva), no agresivo.

REGLAS DE ORO:
1) PRIMERO CATEGORÍA: Si la pregunta es vaga ("hola", "qué tienen", "iluminación"), NO lances productos al azar. Guía: pregunta qué categoría busca. Usa esta taxonomía:
${categoriesList}
Responde con 2-3 preguntas de calificación: uso (hogar/industrial), presupuesto, necesidad SEC/mayorista.

2) CUANDO HAY MATCH ESPECÍFICO (score alto y 1 producto claro): sé persuasivo, destaca beneficios, precio oferta vs original, SEC, garantía, stock y CTA a comprar. Usa specs del contexto. Ejemplo: "Este Proyector 200W IP66 te ahorra 34% ($45.990) y está certificado SEC — ideal para tu galpón. ¿Lo llevamos?" Y EJECUTA AUTOMÁTICAMENTE navigateTo a /producto/[slug] del producto final.

3) BÚSQUEDA GENÉRICA: Si el cliente dice "proyectores", "cintas led", "multímetros" (nombre de categoría/subcategoría), NO muestres 1 producto. EJECUTA navigateTo a /categoria/[slug] de esa categoría y ofrece filtrar dentro. Si el término genérico NO calza con una categoría exacta (ej: "taladro", "amperímetro", "taladro percutor 20V"), EJECUTA navigateTo a /busqueda?q=[término]: abre una ventana con TODOS los productos que coinciden en el catálogo.

4) CAPACIDADES: puedes CAMBIAR DE PÁGINA (navigateTo), BUSCAR EN VIVO (searchProducts) y FILTRAR por categoría/precio/SEC. Úsalas SIEMPRE con tools cuando corresponda. Si detectas match específico, navigateTo a producto; si es genérico de categoría, navigateTo a categoría; si es búsqueda libre, navigateTo a /busqueda?q=[término].

5) Usa SOLO el contexto Excel provisto. No inventes SKU/precio/stock. Si nada calza, di que no está y ofrece alternativa de la misma categoría. Responde siempre en español de Chile, conciso, con SKU, precio CLP, SEC y URL /producto/[slug] o /categoria/[slug].`;

    const userPrompt = `Contexto RAG (top ${top.length} productos para "${message}"):\n${context}\n\nPregunta del cliente: ${message}\n\nInstrucción: Si es vaga, guía a categoría. Si es específica y hay match, seduce y cierra venta + sugiere navigateTo. Usa tools si necesitas buscar o navegar.`;

    const tools: any[] = [
      {
        type: "function",
        function: {
          name: "navigateTo",
          description: "Cambia la página del usuario. Úsalo para llevar a /producto/[slug] o /categoria/[slug] cuando recomienda un producto o categoría.",
          parameters: { type: "object", properties: { path: { type: "string", description: "Ruta Next.js, ej /producto/proyector-led-200w-ip66 o /categoria/iluminacion-led-neon" } }, required: ["path"] }
        }
      },
      {
        type: "function",
        function: {
          name: "searchProducts",
          description: "Busca en vivo en el catálogo Excel. Úsalo para refinar búsqueda por categoría, precio, SEC, marca.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Texto de búsqueda" },
              categorySlug: { type: "string", description: "Slug de categoría, ej iluminacion-led-neon" },
              maxPrice: { type: "number", description: "Precio máximo CLP" },
              secOnly: { type: "boolean", description: "Solo certificados SEC" }
            },
            required: ["query"]
          }
        }
      }
    ];

    const endpoint = isOpenRouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
    const headers: Record<string,string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };
    if (isOpenRouter) {
      headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://demostarshop.vercel.app";
      headers["X-Title"] = "Starshop RAG";
    }

    const r = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: "auto",
        temperature: 0.35,
        max_tokens: 650,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("[chat] LLM error", r.status, errText);
      // Fallback a mock si falla LLM
      const fallback = `Error LLM (${r.status}). Te muestro resultados RAG directos:\n\n${top.map(({p})=>`• ${p.name} — $${p.price.toLocaleString("es-CL")} → /producto/${p.slug}`).join("\n")}`;
      return NextResponse.json({ text: fallback, toolCalls: toolCalls.length?toolCalls:undefined, error: `LLM ${r.status}: ${errText.slice(0,300)}` });
    }

    const data = await r.json();
    const choice = data.choices?.[0];
    const messageRes = choice?.message;

    // Manejo de tool_calls nativos (OpenAI/OpenRouter)
    const rawToolCalls = messageRes?.tool_calls || messageRes?.toolCalls;
    if (rawToolCalls?.length) {
      for (const tc of rawToolCalls) {
        const name = tc.function?.name || tc.toolName;
        let args: any = {};
        try { args = JSON.parse(tc.function?.arguments || tc.args || "{}"); } catch { args = tc.function?.arguments || {}; }
        if (name === "navigateTo" && args.path) {
          const p: string = String(args.path);
          // Sanitiza paths generados por el LLM: solo rutas válidas de la app
          const isProducto = /^\/producto\/[a-z0-9\-]+\/?$/i.test(p);
          const isCategoria = /^\/categoria\/[a-z0-9\-]+\/?$/i.test(p); // un solo slug (sin subcategorías)
          const isBusqueda = /^\/busqueda(\?|$)/.test(p);
          // Evita duplicar la decisión de navegación (la heurística ya pudo navegar a /busqueda o /producto)
          const yaHayNav = toolCalls.some(t => t.toolName === "navigateTo");
          if (!yaHayNav) {
            if (isProducto || isCategoria || isBusqueda) {
              toolCalls.push({ toolName: "navigateTo", args });
            } else {
              // Path malformado (ej: /categoria/x/subcategoria) -> ventana de resultados global
              toolCalls.push({ toolName: "navigateTo", args: { path: `/busqueda?q=${encodeURIComponent(message.trim())}` } });
            }
          }
        } else if (name === "searchProducts" && args.query) {
          const secOnly = !!args.secOnly;
          const filtered = products.filter(p => {
            if (secOnly && !p.secCertified) return false;
            if (args.categorySlug && p.categoryId !== args.categorySlug) return false;
            if (args.maxPrice && p.price > args.maxPrice) return false;
            return true;
          });
          const scored = filtered.map(p=>({p,s:scoreProduct(p, args.query)})).sort((a,b)=>(b.s as number)-(a.s as number)).slice(0,5);
          const searchText = scored.length ? scored.map(({p})=>`• ${p.name} — $${p.price.toLocaleString("es-CL")} ${p.secCertified?"SEC✅":""} → /producto/${p.slug}`).join("\n") : "Sin resultados con esos filtros.";
          // Si el LLM pidió búsqueda, le devolvemos contexto y que genere texto final
          // Por simplicidad, inyectamos el resultado como texto y también como toolCall para el front
          toolCalls.push({ toolName: "searchProducts", args, result: scored.map(s=>s.p.slug) });
          // Si hay un best claro tras búsqueda, navega al producto; si no, a la ventana de resultados global
          if (scored[0] && scored[0].s >=6) {
            toolCalls.push({ toolName: "navigateTo", args: { path: `/producto/${scored[0].p.slug}` } });
          } else {
            toolCalls.push({ toolName: "navigateTo", args: { path: `/busqueda?q=${encodeURIComponent(args.query)}` } });
          }
          // Si no hay tool de navegación previa, dejamos que el LLM genere texto con estos resultados en siguiente turno;
          // como fallback, retornamos directamente
          const searchFallback = `Encontré esto para "${args.query}"${args.categorySlug?` en ${args.categorySlug}`:""}${secOnly?" (solo SEC)":""}:\n${searchText}`;
          return NextResponse.json({ text: searchFallback, toolCalls, debug: { model, topIds: scored.map(s=>s.p.id) } });
        }
      }
      // Si solo fue navigateTo, devolvemos el texto del LLM + tool
      const firstNav = toolCalls.find(t => t.toolName === "navigateTo")?.args?.path ?? "";
      const textFromTool = messageRes?.content || (firstNav.startsWith("/busqueda")
        ? `¡Buena búsqueda! Te abrí la ventana de resultados con todos los productos que coinciden con "${message}". ¿Quieres que filtre por precio, SEC o marca?`
        : `Te llevo a ${firstNav} — es el match perfecto para "${message}". ¿Confirmamos cantidad y despacho?`);
      return NextResponse.json({ text: textFromTool, toolCalls, debug: { model, topIds: top.map(t=>t.p.id) } });
    }

    const text = messageRes?.content || data.choices?.[0]?.text || "Sin respuesta del LLM.";

    // Fallback heurístico ya cubierto arriba (navegación automática), pero por si LLM no usó tools
    // toolCalls ya contiene navegación automática si corresponde

    return NextResponse.json({ text, toolCalls: toolCalls.length?toolCalls:undefined, debug: { model, topIds: top.map(t=>t.p.id) } });

  } catch (err: any) {
    console.error("[chat] error", err);
    return NextResponse.json({ error: err.message || "Error en chat" }, { status: 500 });
  }
}

export async function GET() {
  const hasEmbeds = !!loadEmbeddingsFromFile();
  return NextResponse.json({ 
    ok: true, 
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasEmbeddings: hasEmbeds,
    embeddingsCount: hasEmbeds ? Object.keys(productEmbeddings||{}).length : 0,
    model: process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || "qwen/qwen3-30b-a3b (default)",
    products: products.length,
    example: "POST { message: 'proyector LED bajo 50000 SEC' }"
  });
}
