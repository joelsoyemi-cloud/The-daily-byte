import type { Metadata } from "next";
import { getPublicStories, parsePage, publicUrl, type ListingSearchParams } from "@/lib/public-listings";
import StoryArchive from "@/components/site/StoryArchive";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 0;
export const metadata: Metadata = {
  title: "Videos", description: "Video stories from The Daily Byte.",
  alternates: { canonical: publicUrl("/videos") },
  openGraph: { title: "Videos", url: publicUrl("/videos"), type: "website", siteName: "The Daily Byte" },
};

export default async function VideosPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const page = parsePage((await searchParams).page);
  const listing = await getPublicStories({ page, contentType: "video" });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Reveal><header className="relative mb-10 overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white sm:mb-14 sm:p-12">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-brand" />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">The Daily Byte in motion</p>
        <h1 className="mt-4 font-display text-4xl font-black tracking-tight sm:text-6xl">Press play.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">Discover our latest video stories. Choose a story and watch at your own pace.</p>
      </header></Reveal>
      <StoryArchive {...listing} page={page} path="/videos" video empty="No video stories published yet." />
    </div>
  );
}
