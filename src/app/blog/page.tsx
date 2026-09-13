import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/lib/blog-mock";

export const metadata: Metadata = {
  title: "Blog | Starshop",
  description: "Guías técnicas, comparativas y consejos B2B. Contenido demo (mockup) para SEO.",
  alternates: { canonical: "https://starshop.cl/blog" },
};

export default function BlogPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-black">Blog Starshop (demo)</h1>
      <p className="text-sm text-zinc-500 mt-1">Artículos mockup para captar tráfico long-tail. No son asesoría real.</p>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {blogPosts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-lg transition block">
            <Image src={p.image} alt={p.title} width={800} height={400} className="h-40 w-full object-cover bg-zinc-50" />
            <div className="p-4">
              <div className="text-xs text-zinc-500">{p.date} • {p.author}</div>
              <h2 className="font-bold leading-tight mt-1 line-clamp-2">{p.title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">{p.excerpt}</p>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {p.tags.map((t) => <span key={t} className="text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{t}</span>)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
