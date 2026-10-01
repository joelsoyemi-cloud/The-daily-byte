import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicStories, parsePage, type ListingSearchParams } from "@/lib/public-listings";
import StoryArchive from "@/components/site/StoryArchive";
import { Reveal } from "@/components/motion/Reveal";
import { publicPageMetadata } from "@/lib/site";

export const revalidate = 0;
type Category = { id: string; name: string; slug: string; description: string | null };
const getCategory = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, name, slug, description").eq("slug", slug).returns<Category[]>().maybeSingle();
  if (error) throw new Error("Unable to load this category.");
  return data;
});

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: ListingSearchParams }): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};
  return publicPageMetadata({ title: category.name, description: category.description || undefined, path: `/section/${encodeURIComponent(category.slug)}`, page: parsePage((await searchParams).page) });
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: ListingSearchParams }) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  const page = parsePage((await searchParams).page);
  const listing = await getPublicStories({ page, categoryId: category.id });
  const path = `/section/${encodeURIComponent(category.slug)}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Reveal><header className="mb-10 max-w-3xl sm:mb-14">
        <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-2 text-sm text-muted"><li><Link href="/" className="inline-flex min-h-11 items-center hover:text-brand">Home</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="[overflow-wrap:anywhere]">{category.name}</li></ol></nav>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand">Explore the section</p>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">{category.name}</h1>
        {category.description && <p className="mt-5 text-lg leading-relaxed text-muted [overflow-wrap:anywhere]">{category.description}</p>}
      </header></Reveal>
      <StoryArchive {...listing} page={page} path={path} editorial empty="No stories in this section yet." />
    </div>
  );
}
