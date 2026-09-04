import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, type Post } from '@/lib/posts';

export const revalidate = 0;

function CoverImage({ post, className }: { post: Post; className?: string }) {
  if (post.cover_image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={post.cover_image} alt="" className={className} />;
  }
  return (
    <div
      className={`${className} bg-ink flex items-center justify-center`}
    >
      <span className="font-display font-900 text-white/20 text-4xl select-none">
        {post.category?.[0] ?? 'B'}
      </span>
    </div>
  );
}

function CategoryTag({ category }: { category: string }) {
  return (
    <span className="inline-block bg-brand text-white text-[11px] font-bold uppercase tracking-wide px-2 py-1">
      {category}
    </span>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  const list = (posts ?? []) as Post[];
  const [featured, ...rest] = list;
  const trending = list.slice(0, 5);

  if (list.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-20 text-center">
        <p className="text-muted">No stories published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {/* Featured story */}
          <Link href={`/blog/${featured.slug}`} className="group block mb-10">
            <CoverImage post={featured} className="w-full aspect-[16/9] object-cover mb-4" />
            <div className="mb-2">
              <CategoryTag category={featured.category} />
            </div>
            <h1 className="font-display font-900 text-3xl md:text-4xl leading-[1.1] mb-3 group-hover:text-brand transition-colors">
              {featured.title}
            </h1>
            {featured.excerpt && (
              <p className="text-muted text-lg leading-relaxed max-w-prose">
                {featured.excerpt}
              </p>
            )}
            <p className="text-xs text-muted mt-3">
              {featured.published_at ? formatDate(featured.published_at) : ''}
            </p>
          </Link>

          {/* Grid of remaining stories */}
          <div className="grid sm:grid-cols-2 gap-8 border-t-2 border-ink pt-8">
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <CoverImage post={post} className="w-full aspect-[4/3] object-cover mb-3" />
                <div className="mb-2">
                  <CategoryTag category={post.category} />
                </div>
                <h2 className="font-display font-700 text-lg leading-snug mb-1.5 group-hover:text-brand transition-colors">
                  {post.title}
                </h2>
                <p className="text-xs text-muted">
                  {post.published_at ? formatDate(post.published_at) : ''}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending sidebar */}
        <aside>
          <h3 className="font-display font-900 text-sm uppercase tracking-wide border-b-2 border-ink pb-2 mb-4">
            Trending Now
          </h3>
          <ol className="space-y-5">
            {trending.map((post, i) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group flex gap-3 items-start">
                  <span className="font-display font-900 text-2xl text-line leading-none group-hover:text-brand transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium leading-snug group-hover:text-brand transition-colors">
                    {post.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
