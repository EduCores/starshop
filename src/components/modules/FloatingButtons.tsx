"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowUp, Bot, X, Send, Sparkles, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgent } from "@/store/agent";
import { products } from "@/lib/mock-data";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);
  const { isOpen: agentOpen, setOpen: setAgentOpen, pendingProduct, setPendingProduct } = useAgent();
  const [agentInput, setAgentInput] = useState("");
  const [agentMessages, setAgentMessages] = useState<{ role: "user" | "agent"; text: string }[]>([
    { role: "agent", text: "Hola! Soy Star, tu asistente de Starshop. ¿En qué te ayudo hoy?" },
  ]);
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentPulse, setAgentPulse] = useState(0);
  const [agentListening, setAgentListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const ACS_URL = process.env.NEXT_PUBLIC_ACS_API_URL ?? "https://agentic-commerce-stack.vercel.app";

  const getProductPath = (input: string): string | null => {
    const t = input.toLowerCase().trim();
    // SKU exacto (producto usa /producto/[id] con p.id, no slug)
    const bySku = products.find((p) => p.sku.toLowerCase() === t || p.sku.toLowerCase().replace(/-/g, "") === t.replace(/-/g, ""));
    if (bySku) return `/producto/${bySku.id}`;
    if (t.length >= 5) {
      const byName = products.find((p) => p.name.toLowerCase().includes(t) || t.includes(p.name.toLowerCase().substring(0, 20)));
      if (byName) return `/producto/${byName.id}`;
      const words = t.split(" ").filter((w) => w.length > 3);
      if (words.length >= 2) {
        const scored = products
          .map((p) => ({ p, score: words.filter((w) => p.name.toLowerCase().includes(w)).length }))
          .filter((x) => x.score >= 2)
          .sort((a, b) => b.score - a.score);
        if (scored[0]?.score >= 2) return `/producto/${scored[0].p.id}`;
      }
    }
    return null;
  };

  const getCategoryPath = (input: string): string | null => {
    const t = input.toLowerCase();
    if (t.includes("proyector") || t.includes("proyectores")) return "/categoria/iluminacion-led-neon?search=proyector";
    if (t.includes("taladro") || t.includes("taladros") || t.includes("sierra") || t.includes("herramienta")) return "/categoria/herramientas-maquinarias?search=taladro";
    if (t.includes("multimetro") || t.includes("pinza") || t.includes("pirometro") || t.includes("cámara term")) return "/categoria/instrumentos-medicion?search=multimetro";
    if (t.includes("tubo") || t.includes("uv") || t.includes("germicida")) return "/categoria/tubos-lamparas-especiales?search=uv";
    if (t.includes("pila") || t.includes("bateria") || t.includes("18650")) return "/categoria/pilas-baterias-cargadores?search=bateria";
    if (t.includes("panel") || t.includes("led") || t.includes("neon") || t.includes("iluminaci")) return "/categoria/iluminacion-led-neon?search=led";
    return null;
  };

  const getAutoNavigatePath = (input: string): { path: string; label: string } | null => {
    const prod = getProductPath(input);
    if (prod) {
      const pid = prod.split("/").pop();
      const p = products.find((x) => x.id === pid);
      return { path: prod, label: p?.name ?? input };
    }
    const cat = getCategoryPath(input);
    if (cat) return { path: cat, label: input };
    return null;
  };

  const getAgentReply = async (input: string): Promise<{ text: string; navigateTo?: string }> => {
    try {
      const r = await fetch(`${ACS_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, agentSlug: "sales-assistant", storeId: "seed-store" }),
      });
      const data = await r.json();
      const calls = data.toolCalls ?? [];
      const nav = calls.find((t: any) => t.toolName === "navigateTo" || t.name === "navigateTo");
      const chk = calls.find((t: any) => t.toolName === "checkout" || t.name === "checkout");
      const navigateTo = chk?.args?.checkoutUrl ?? chk?.result?.checkoutUrl ?? nav?.args?.path ?? nav?.input?.path ?? nav?.result?.navigateTo;
      if (data.text) return { text: data.text, navigateTo };
      if (data.error) return { text: `Error ACS: ${data.error}` };
      return { text: "Sin respuesta del agente. Verificá OPENROUTER_API_KEY en ACS." };
    } catch {
      return { text: "Error: no pude conectar con ACS. Verifica que agentic-commerce-stack esté en Producción." };
    }
  };

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Abrir desde Cotizar con animación simpática
  useEffect(() => {
    if (pendingProduct) {
      setAgentTyping(true);
      setAgentPulse((k) => k + 1);
      setTimeout(() => {
        setAgentMessages((m) => [
          ...m,
          { role: "agent", text: `¡Genial! Quieres cotizar "${pendingProduct}". ¿Me cuentas cuántas unidades necesitas y si es para empresa? ¿RUT y comuna para calcular despacho?` },
        ]);
        setAgentTyping(false);
        setPendingProduct(null);
      }, 700);
    }
  }, [pendingProduct, setPendingProduct]);

  // Detener micrófono al desmontar/cerrar el panel
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Voz → texto (Web Speech API nativa, sin librerías). Transcribe en español y envía la consulta al agente.
  const toggleAgentVoice = () => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setAgentMessages((m) => [...m, { role: "agent", text: "Tu navegador no soporta captura por voz. Usa Chrome, Edge o Safari para dictar tu consulta." }]);
      return;
    }
    if (agentListening) {
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
      setAgentListening(false);
      return;
    }
    setAgentInput("");
    const recognition = new SR();
    recognition.lang = "es-CL";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const transcript = (e.results?.[0]?.[0]?.transcript ?? "").trim();
      try { recognition.stop(); } catch { /* noop */ }
      if (transcript) {
        setAgentInput(transcript);
        window.setTimeout(() => sendAgent(transcript), 150);
      }
    };
    recognition.onend = () => setAgentListening(false);
    recognition.onerror = (e: any) => {
      setAgentListening(false);
      if (e?.error && e.error !== "aborted" && e.error !== "no-speech" && e.error !== "not-allowed") {
        setAgentMessages((m) => [...m, { role: "agent", text: `No pude captar tu voz (${e.error}). Intenta de nuevo.` }]);
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setAgentListening(true);
    } catch {
      setAgentListening(false);
      setAgentMessages((m) => [...m, { role: "agent", text: "No pude iniciar el micrófono. Verifica que esté disponible y da permiso al navegador." }]);
    }
  };

  const sendAgent = async (override?: string) => {
    const t = (override ?? agentInput).trim();
    if (!t) return;
    setAgentMessages((m) => [...m, { role: "user", text: t }]);
    setAgentInput("");
    setAgentTyping(true);

    // Navegación automática local: primero producto específico (SKU/nombre), luego categoría
    const auto = getAutoNavigatePath(t);
    const wantsToSee = /ver|mostrar|llevame|muestrame|quiero ver|busco|ir/i.test(t);
    if (auto && (wantsToSee || t.length >= 5)) {
      const isProduct = auto.path.startsWith("/producto/");
      const friendly = isProduct ? `¡Perfecto! Te llevo a "${auto.label}" — abriendo la ficha...` : `¡Vamos! Te llevo a ${t} — abriendo la categoría...`;
      setAgentMessages((m) => [...m, { role: "agent", text: friendly }]);
      setAgentTyping(false);
      setTimeout(() => { window.location.href = auto.path; }, 900);
      getAgentReply(t).catch(() => {});
      return;
    }

    const { text, navigateTo } = await getAgentReply(t);
    setAgentMessages((m) => [...m, { role: "agent", text }]);
    setAgentTyping(false);
    const finalNav = navigateTo ?? auto?.path;
    if (finalNav) {
      setTimeout(() => { window.location.href = finalNav.startsWith("http") ? finalNav : finalNav; }, 800);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-3">
      {/* Volver arriba - arriba del agente */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-[#232F3E] text-white shadow-lg flex items-center justify-center hover:bg-[#0F1111] transition-colors"
            aria-label="Volver arriba"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Agente IA - alineado vertical con WhatsApp */}
      <motion.button
        key={`agent-${agentPulse}`}
        onClick={() => setAgentOpen(!agentOpen)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative h-[67px] w-[67px] md:h-16 md:w-16 rounded-full bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] text-black shadow-xl flex items-center justify-center hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))] transition-colors ${agentPulse ? "animate-wiggle" : ""}`}
        aria-label="Agente IA"
      >
        <span className="absolute inset-0 rounded-full bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] animate-ping opacity-20" aria-hidden />
        <Bot className="h-8 w-8 md:h-8 md:w-8 relative" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white" aria-hidden />
        <AnimatePresence>
          {agentPulse > 0 && (
            <motion.span
              key={agentPulse}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -12 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <Sparkles className="h-4 w-4 text-[#FFD814]" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel agente */}
      <AnimatePresence>
        {agentOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="w-[320px] md:w-[360px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border overflow-hidden flex flex-col"
          >
            <div className="bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] text-black px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm"><Bot className="h-5 w-5" /> Agente Starshop</div>
              <button onClick={() => setAgentOpen(false)} className="p-1 hover:bg-white/20 rounded" aria-label="Cerrar"><X className="h-4 w-4" /></button>
            </div>
            <div className="text-[11px] bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-3 py-2 flex items-center gap-2"><span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" /> ACS activo</div>
            <div className="flex-1 max-h-[320px] overflow-auto p-3 space-y-2">
              {agentMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"}`}>{m.text}</div>
                </div>
              ))}
              {agentTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2 text-sm flex gap-1 items-center">
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-2 flex gap-2">
              <input
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAgent()}
                placeholder={
                  agentListening
                    ? "Escuchando... habla ahora"
                    : "Ej: busca proyector LED o panel 36W..."
                }
                className="flex-1 border rounded-full px-4 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[rgb(255_216_20/var(--tw-bg-opacity,1))]"
              />
              {/* Grabar voz: transcribe la consulta del cliente y la envía al agente */}
              <button
                onClick={toggleAgentVoice}
                title={agentListening ? "Detener grabación" : "Grabar mensaje por voz"}
                aria-label={agentListening ? "Detener grabación de voz" : "Grabar mensaje por voz"}
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                  agentListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {agentListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button onClick={() => sendAgent()} className="h-9 w-9 rounded-full bg-[rgb(255_216_20/var(--tw-bg-opacity,1))] text-black flex items-center justify-center hover:bg-[rgb(247_202_0/var(--tw-bg-opacity,1))]"><Send className="h-4 w-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp - alineado vertical con agente */}
      <motion.a
        href="https://wa.me/56993301557?text=Hola%20Starshop,%20quiero%20hacer%20una%20consulta"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative h-[67px] w-[67px] md:h-16 md:w-16 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:bg-[#128C7E] transition-colors"
        aria-label="Contactar por WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" aria-hidden />
        <WhatsAppIcon className="h-8 w-8 md:h-8 md:w-8 relative" />
      </motion.a>
    </div>
  );
}
