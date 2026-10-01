import { publicPageMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, parsePage, publicVisibility, type ListingSearchParams } from "@/lib/public-listings";
import TypographyList, { type OpinionPost } from "@/components/site/sections/TypographyList";
import Pagination from "@/components/site/Pagination";
import { ArchiveMessage } from "@/components/site/StoryArchive";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 0;
export async function generateMetadata({ searchParams }: { searchParams: ListingSearchParams }): Promise<Metadata> {
  return publicPageMetadata({ title: "Opinions", description: "Perspectives and opinion from The Daily Byte.", path: "/opinions", page: parsePage((await searchParams).page) });
}

export default async function OpinionsPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const page = parsePage((await searchParams).page);
  const supabase = await createClient();
  const { data, count, error } = await supabase.from("posts")
    .select("slug, title, excerpt, published_at, profiles(display_name, username)", { count: "exact" })
    .eq("content_type", "opinion")
    .or(publicVisibility())
    .order("published_at", { ascending: false, nullsFirst: false }).order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .returns<OpinionPost[]>();
  const posts = data ?? [];
  const failed = Boolean(error && error.code !== "PGRST103");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <Reveal><header className="mb-12 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Ideas & perspectives</p>
        <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-6xl">Opinions</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">A place for perspectives, arguments, and a closer look at the stories shaping our world.</p>
      </header></Reveal>
      {failed || !posts.length ? <ArchiveMessage failed={failed} page={page} path="/opinions" empty="No opinion pieces published yet." /> : <>
        <section aria-labelledby="latest-opinions"><h2 id="latest-opinions" className="mb-5 text-xs font-bold uppercase tracking-widest text-muted">Latest perspectives</h2><TypographyList posts={posts} /></section>
        <Pagination page={page} count={count ?? 0} path="/opinions" />
      </>}
    </div>
  );
}
