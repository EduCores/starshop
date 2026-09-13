"use client";
import { useState, useEffect } from "react";
import { heroSlides } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % heroSlides.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="container mt-3 md:mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4">
      {/* Carousel */}
      <div className="lg:col-span-3 relative rounded-lg overflow-hidden bg-black group h-[280px] md:h-[340px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image src={slide.image} alt={slide.title} width={1200} height={800} priority={current === 0} className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg} opacity-80 mix-blend-multiply`} />
            <div className="relative h-full flex flex-col justify-center p-6 md:p-10 text-white max-w-xl">
              <span className="animate-floaty inline-block bg-white/20 backdrop-blur text-xs font-bold px-2 py-1 rounded w-fit mb-3">🔥 OFERTA LIMITADA</span>
              <h2 className="text-2xl md:text-4xl font-black leading-tight">{slide.title}</h2>
              <p className="text-lg md:text-xl font-bold text-[#FFD814] mt-1">{slide.subtitle}</p>
              <p className="text-sm text-white/90 mt-2 hidden md:block">{slide.description}</p>
              <div className="flex gap-3 mt-4">
                <Button variant="starshop" size="lg" className="rounded-full px-6">
                  {slide.cta}
                </Button>
                <Button variant="outline" size="lg" className="rounded-full bg-white/10 border-white text-white hover:bg-white hover:text-black">
                  Cotizar
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button onClick={() => setCurrent((c) => (c - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur opacity-0 group-hover:opacity-100 transition">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => setCurrent((c) => (c + 1) % heroSlides.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur opacity-0 group-hover:opacity-100 transition">
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-white" : "w-2 bg-white/50"}`}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-3">
        <div className="bg-gradient-to-br from-[#232F3E] to-[#0F1111] text-white rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FFD814]">
            <Award className="h-4 w-4" /> BENEFICIO B2B
          </div>
          <h4 className="font-black text-lg leading-tight mt-2">
            ¿Eres contratista?
            <br />
            Precios mayoristas
          </h4>
          <p className="text-xs text-zinc-300 mt-2">Descuentos por volumen, factura y crédito 30 días.</p>
          <Button variant="starshop" size="sm" className="w-full mt-3 rounded-full">
            Solicitar cuenta B2B
          </Button>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-400">
            <Clock className="h-3 w-3" /> Aprobación en 24h
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border p-3 flex items-center gap-2 text-xs">
          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="font-medium">1.243 pedidos despachados hoy</span>
          <span className="ml-auto text-zinc-500">En vivo</span>
        </div>
      </div>
    </section>
  );
}
