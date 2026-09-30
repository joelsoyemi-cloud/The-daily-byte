import Link from "next/link";
import { StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

type OpinionPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  profiles?: { display_name: string } | null;
};

export default function TypographyList({ posts }: { posts: OpinionPost[] }) {
  return (
    <StaggerReveal
      className="divide-y divide-line border-t border-line"
      staggerDelay={0.05}
    >
      {posts.map((post) => (
        <StaggerItem key={post.slug}>
          <Link
            href={`/blog/${post.slug}`}
            className="group block py-6 sm:py-8"
          >
            <h3 className="font-display font-700 text-xl sm:text-2xl lg:text-3xl leading-snug transition-colors duration-200 group-hover:text-brand">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-muted mt-2 max-w-2xl leading-relaxed">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 text-sm text-muted">
              {post.profiles?.display_name && (
                <span className="font-medium text-ink">
                  {post.profiles.display_name}
                </span>
              )}
              {post.published_at && (
                <>
                  <span>&middot;</span>
                  <span>
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </Link>
        </StaggerItem>
      ))}
    </StaggerReveal>
  );
}
