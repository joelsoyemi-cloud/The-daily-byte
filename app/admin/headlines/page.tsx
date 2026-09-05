import Link from "next/link";
import { fetchHeadlines, HEADLINE_CATEGORIES } from "@/lib/headlines";
import { slugify } from "@/lib/posts";

export const revalidate = 900;

export default async function HeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && HEADLINE_CATEGORIES.includes(category) ? category : "General";
  const headlines = await fetchHeadlines(activeCategory);

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-2">Today's Headlines</h1>
      <p className="text-sm text-muted mb-6">
        Real, current stories — pick one to start a draft. Updates every 15
        minutes.
      </p>

      <div className="flex flex-wrap gap-2 mb-8 border-b-2 border-ink pb-4">
        {HEADLINE_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/admin/headlines?category=${cat}`}
            className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 ${
              cat === activeCategory
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {headlines.length === 0 && (
        <p className="text-muted text-sm">
          Couldn't load headlines right now — try refreshing in a moment.
        </p>
      )}

      <ul className="divide-y divide-line">
        {headlines.map((h, i) => (
          <li key={i} className="py-4">
            <p className="font-semibold mb-1">{h.title}</p>
            <p className="text-xs text-muted mb-2">
              {h.source} &middot; {new Date(h.pubDate).toLocaleString()}
            </p>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wide">
              <Link
                href={`/admin/new?title=${encodeURIComponent(h.title)}&category=${activeCategory}&slug=${slugify(h.title)}&source=${encodeURIComponent(h.link)}`}
                className="text-brand hover:underline"
              >
                Start draft from this →
              </Link>
              <a
                href={h.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-ink"
              >
                Read source
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
