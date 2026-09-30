import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function BreakingTicker() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('title, slug')
    .eq('breaking', true)
    .or(`status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`)
    .order('published_at', { ascending: false })
    .limit(6);

  if (!posts || posts.length === 0) return null;

  return (
    <div id="breaking" className="bg-ink text-white overflow-hidden">
      <div className="max-w-6xl mx-auto flex items-center">
        <span className="shrink-0 bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
          Breaking
        </span>

        {posts.length === 1 ? (
          <Link href={`/blog/${posts[0].slug}`} className="px-4 py-2.5 text-sm font-medium hover:text-brand transition-colors truncate">
            {posts[0].title}
          </Link>
        ) : (
          <div className="flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <div className="flex motion-safe:animate-ticker whitespace-nowrap py-2.5">
              {[...posts, ...posts].map((post, i) => (
                <Link
                  key={i}
                  href={`/blog/${post.slug}`}
                  className="px-6 text-sm font-medium hover:text-brand transition-colors shrink-0"
                >
                  {post.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}