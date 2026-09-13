import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/lib/blog-mock";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  const title = post ? `${post.title} | Blog Starshop` : "Blog | Starshop";
  const description = post?.excerpt ?? "Artículo demo del blog Starshop.";
  const url = `https://starshop.cl/blog/${params.slug}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "article", images: post ? [{ url: post.image, width: 800, height: 600, alt: post.title }] : undefined } };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();
  return (
    <div className="container py-8 max-w-3xl">
      <Link href="/blog" className="text-sm text-[#007185] hover:underline">← Volver al blog</Link>
      <div className="text-xs text-zinc-500 mt-4">{post.date} • {post.author}</div>
      <h1 className="text-2xl md:text-3xl font-black leading-tight mt-1">{post.title}</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mt-2">{post.excerpt}</p>
      <Image src={post.image} alt={post.title} width={800} height={400} className="mt-6 w-full rounded-lg border bg-zinc-50 object-cover max-h-[400px]" />
      <div className="flex gap-1.5 mt-4 flex-wrap">
        {post.tags.map((t) => <span key={t} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{t}</span>)}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-6 text-xs text-amber-800">Contenido <strong>demo / mockup</strong> — no es asesoría técnica real. Productos mostrados son de catálogo de ejemplo.</div>
      <article className="prose dark:prose-invert prose-sm max-w-none mt-6 whitespace-pre-wrap leading-relaxed">{post.content}</article>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="text-sm font-bold text-[#007185] hover:underline">Explorar catálogo demo →</Link>
      </div>
    </div>
  );
}
