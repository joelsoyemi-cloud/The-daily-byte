import Link from "next/link";
import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";
import LeadPlusGrid from "@/components/site/sections/LeadPlusGrid";
import ImageGrid from "@/components/site/sections/ImageGrid";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import Pagination from "@/components/site/Pagination";

export function ArchiveMessage({ failed, page, path, empty }: { failed: boolean; page: number; path: string; empty: string }) {
  return (
    <div className="rounded-3xl border border-line bg-surface px-6 py-12 text-center">
      <p className="font-display text-xl font-bold">{failed ? "Stories are temporarily unavailable." : page > 1 ? "There are no stories on this page." : empty}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{failed ? "Please try again in a moment." : "Explore the latest from across The Daily Byte."}</p>
      <Link href={failed || page > 1 ? path : "/"} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-brand motion-safe:transition-colors">{failed ? "Try again" : page > 1 ? "Back to the first page" : "Visit the front page"}</Link>
    </div>
  );
}

export default function StoryArchive({ posts, count, failed, page, path, empty, editorial = false, video = false }: {
  posts: StoryCardPost[]; count: number; failed: boolean; page: number; path: string; empty: string; editorial?: boolean; video?: boolean;
}) {
  if (failed || !posts.length) return <ArchiveMessage failed={failed} page={page} path={path} empty={empty} />;
  const lead = editorial && page === 1 ? posts.slice(0, 3) : [];
  const latest = lead.length ? posts.slice(3) : posts;
  return (
    <>
      {lead.length > 0 && <section aria-labelledby="archive-focus" className="mb-12">
        <Reveal><h2 id="archive-focus" className="mb-6 font-display text-2xl font-bold">In focus</h2></Reveal>
        <LeadPlusGrid posts={lead} />
      </section>}
      {latest.length > 0 && <section aria-labelledby="archive-latest">
        <Reveal><h2 id="archive-latest" className="mb-6 font-display text-2xl font-bold">{video ? "Latest videos" : "Latest stories"}</h2></Reveal>
        {video ? <ImageGrid posts={latest} /> : <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post) => <StaggerItem key={post.slug} className="min-w-0"><StoryCard post={post} /></StaggerItem>)}
        </StaggerReveal>}
      </section>}
      <Pagination page={page} count={count} path={path} />
    </>
  );
}
