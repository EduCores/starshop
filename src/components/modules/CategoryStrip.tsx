import { superCategories } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { Stagger, StaggerItem } from "@/components/ui/reveal";
import { Lightbulb, Wrench, Gauge, Zap, BatteryCharging, ShieldCheck, Cpu, LucideProps } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Lightbulb,
  Wrench,
  Gauge,
  FlaskConical: Lightbulb,
  Zap,
  BatteryCharging,
  ShieldCheck,
  Cpu,
};

// Mapeo a imágenes locales en /public con mismo nombre exacto
const CAT_IMAGE_MAP: Record<string, string> = {
  "iluminacion-led-neon": "/Iluminacion LED & Neon Flex.png",
  "herramientas-maquinarias": "/Herramientas y Maquinarias.png",
  "instrumentos-medicion": "/Instrumentos de Medicion y Termicos.png",
  "tubos-lamparas-especiales": "/Tubos y Lamparas Especiales.png",
  "fuentes-poder-soldadura": "/Fuentes de Poder y Soldadura.png",
  "pilas-baterias-cargadores": "/Pilas Baterias & Cargadores.png",
  "seguridad-control-electrico": "/Seguridad & Control Electrico.png",
  "electronica-miscelaneos": "/Electronica & Miscelaneos.png",
};

export function CategoryStrip() {
  return (
    <section className="container mt-6 max-w-full overflow-hidden">
      <div className="bg-white dark:bg-zinc-900 rounded-lg border p-3 sm:p-4 overflow-hidden">
        <h2 className="font-black text-lg mb-4">Compra por Categoría</h2>
        <Stagger className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {superCategories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] ?? Cpu;
            return (
              <StaggerItem key={cat.id}>
                <Link href={`/categoria/${cat.slug}`} className="group text-center block transition-transform duration-200 hover:-translate-y-1">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-50 border group-hover:shadow-md transition relative">
                    <Image
                      src={CAT_IMAGE_MAP[cat.id] ?? cat.image}
                      alt={cat.name}
                      width={600}
                      height={900}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
                    <div className="relative h-full w-full flex flex-col items-center justify-center gap-2 p-2">
                      <div className={`h-20 w-20 rounded-full flex items-center justify-center text-white shadow-lg ${cat.color} group-hover:scale-105 active:scale-90 active:ring-4 active:ring-white/30 transition-transform duration-200`}>
                        <Icon className="h-10 w-10" />
                      </div>
                      <div className="text-[18px] max-xl:text-[15px] font-bold leading-tight line-clamp-2 text-white group-hover:text-[#FF3B30]">{cat.name}</div>
                      <div className="text-[14px] lg:text-[11px] text-white/80">{cat.subcategories.reduce((a, b) => a + b.count, 0)} productos</div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

