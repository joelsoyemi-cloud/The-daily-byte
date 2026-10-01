import Link from "next/link";
import { StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

export type OpinionPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  profiles?: { display_name: string; username: string | null } | null;
};

export default function TypographyList({ posts }: { posts: OpinionPost[] }) {
  return (
    <StaggerReveal
      className="divide-y divide-line border-t border-line"
      staggerDelay={0.05}
    >
      {posts.map((post) => (
        <StaggerItem key={post.slug} className="min-w-0 py-6 sm:py-8 [overflow-wrap:anywhere]">
          <Link
            href={`/blog/${post.slug}`}
            className="group block rounded-lg"
          >
            <h3 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl leading-snug motion-safe:transition-colors motion-safe:duration-200 group-hover:text-brand">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-muted mt-2 max-w-2xl leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </Link>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm text-muted">
              {post.profiles?.display_name && (
                post.profiles.username ? <Link href={`/author/${encodeURIComponent(post.profiles.username)}`} className="inline-flex min-h-11 items-center font-medium text-ink hover:text-brand">{post.profiles.display_name}</Link> : <span className="font-medium text-ink">{post.profiles.display_name}</span>
              )}
              {post.published_at && !Number.isNaN(Date.parse(post.published_at)) && (
                  <time dateTime={post.published_at}>
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
              )}
            </div>
        </StaggerItem>
      ))}
    </StaggerReveal>
  );
}
