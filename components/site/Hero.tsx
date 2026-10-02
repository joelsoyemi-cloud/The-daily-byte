import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";
import HeroVideo from "@/components/site/HeroVideo";

export default async function Hero() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "slug, title, excerpt, cover_image, content_type, published_at, categories(name, slug)",
    )
    .or(
      `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`,
    )
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(4)
    .returns<StoryCardPost[]>();

  const [lead, ...secondary] = posts ?? [];

  return (
    <>
      <section aria-labelledby="hero-heading" className="relative isolate mx-auto flex min-h-[600px] w-full items-end overflow-hidden bg-ink md:min-h-[620px]">
        <HeroVideo />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-10 pt-40 sm:pb-12 md:pt-52">
          <h1 id="hero-heading" className="max-w-3xl font-display text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Stories worth reading. Voices worth publishing.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white sm:text-lg">
            News, tech, culture and student stories — all in one place.
          </p>
          <div className="mt-7 flex flex-col gap-3 min-[360px]:items-start sm:flex-row sm:items-center">
            <Link href="#stories" className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-[#B82232] focus-visible:outline-white">
              Explore Stories
            </Link>
            <Link href="/write" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/70 bg-black/40 px-6 py-3 text-sm font-bold text-white hover:bg-black/70 focus-visible:outline-white">
              Write for The Daily Byte
            </Link>
          </div>
        </div>
      </section>
      <section id="stories" className="max-w-6xl mx-auto scroll-mt-24 px-5 pt-8 sm:pt-12 pb-4">
        <h2 className="sr-only">Top stories</h2>
        {lead && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Reveal className="min-w-0 lg:col-span-2">
              <StoryCard post={lead} size="lead" />
            </Reveal>

            {secondary.length > 0 && (
              <StaggerReveal className="min-w-0 flex flex-col gap-4" staggerDelay={0.08}>
                {secondary.map((post) => (
                  <StaggerItem key={post.slug}>
                    <Link
                      href={`/blog/${encodeURIComponent(post.slug)}`}
                      className="group flex min-w-0 gap-3 items-start rounded-xl [overflow-wrap:anywhere] sm:gap-4"
                    >
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden bg-surface">
                        {post.cover_image ? (
                          <Image
                            src={post.cover_image}
                            alt=""
                            fill
                            sizes="(max-width: 639px) 96px, 112px"
                            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span aria-hidden="true" className="font-display font-black text-brand/40 text-xl">
                              {post.categories?.name?.[0] ?? "B"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 pt-1">
                        {post.categories && (
                          <span className="text-[11px] font-bold uppercase tracking-wide text-brand">
                            {post.categories.name}
                          </span>
                        )}
                        <h3 className="font-display font-bold text-sm sm:text-base leading-snug mt-1 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-0.5">
                          {post.title}
                        </h3>
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerReveal>
            )}
          </div>
        )}
      </section>
    </>
  );
}
