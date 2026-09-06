import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDate, estimateReadMinutes, type Post } from "@/lib/posts";
import Markdown from "@/components/Markdown";

export const revalidate = 0;

async function getPost(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  return (data as Post) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://the-dailybyte-nine.vercel.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    articleSection: post.category,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "The Daily Byte",
    },
  };

  return (
    <article className="max-w-3xl mx-auto px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/"
        className="text-xs text-muted hover:text-brand font-medium"
      >
        &larr; Back to front page
      </Link>

      <header className="mt-6 mb-8">
        <span className="inline-block bg-brand text-white text-[11px] font-bold uppercase tracking-wide px-2 py-1 mb-4">
          {post.category}
        </span>
        <h1 className="font-display font-900 text-3xl md:text-4xl leading-[1.1] mb-4">
          {post.title}
        </h1>
        <div className="text-sm text-muted flex items-center gap-3">
          <span>{post.published_at ? formatDate(post.published_at) : ""}</span>
          <span>&middot;</span>
          <span>{estimateReadMinutes(post.content)} min read</span>
        </div>
      </header>

      {post.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image}
          alt=""
          className="w-full aspect-[16/9] object-cover mb-8"
        />
      )}

      <Markdown content={post.content} />
    </article>
  );
}
