import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BreakingTickerTrack from '@/components/site/BreakingTickerTrack';

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
      <div className="max-w-6xl mx-auto flex min-w-0 items-center">
        <span className="shrink-0 bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
          Breaking
        </span>

        {posts.length === 1 ? (
          <Link href={`/blog/${posts[0].slug}`} className="min-h-11 min-w-0 px-4 py-2.5 text-sm font-medium hover:text-white/75 motion-safe:transition-colors truncate">
            {posts[0].title}
          </Link>
        ) : (
          <BreakingTickerTrack posts={posts} />
        )}
      </div>
    </div>
  );
}
