import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDate, type Post } from '@/lib/posts';
import DeletePostButton from './DeletePostButton';

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  const list = (posts ?? []) as Post[];

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-900 text-2xl">Posts</h1>
        <Link
          href="/admin/new"
          className="bg-ink text-white px-4 py-2 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors"
        >
          + New post
        </Link>
      </div>

      {list.length === 0 && (
        <p className="text-muted text-sm">
          No posts yet. Click "New post" to write your first one.
        </p>
      )}

      <ul className="divide-y divide-line border-t-2 border-ink">
        {list.map((post) => (
          <li key={post.id} className="py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{post.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-surface px-1.5 py-0.5 text-muted">
                  {post.category}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 shrink-0 ${
                    post.published ? 'bg-brand/10 text-brand' : 'bg-gold/10 text-gold'
                  }`}
                >
                  {post.published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                {formatDate(post.updated_at)} &middot; /blog/{post.slug}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wide shrink-0">
              <Link href={`/admin/edit/${post.id}`} className="text-muted hover:text-brand">
                Edit
              </Link>
              <DeletePostButton postId={post.id} postTitle={post.title} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
