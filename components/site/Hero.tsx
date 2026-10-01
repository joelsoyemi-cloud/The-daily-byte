import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";

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

  if (!posts || posts.length === 0) return null;

  const [lead, ...secondary] = posts;

  return (
    <section className="max-w-6xl mx-auto px-5 pt-8 sm:pt-12 pb-4">
      <h2 className="sr-only">Top stories</h2>
      <div className="grid lg:grid-cols-3 gap-6">
        <Reveal className="min-w-0 lg:col-span-2">
          <StoryCard post={lead} size="lead" priority />
        </Reveal>

        {secondary.length > 0 && (
          <StaggerReveal className="min-w-0 flex flex-col gap-4" staggerDelay={0.08}>
            {secondary.map((post) => (
              <StaggerItem key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
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
    </section>
  );
}
