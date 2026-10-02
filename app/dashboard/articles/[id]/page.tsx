import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireContributor } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/posts';
import ShareActions from '@/components/site/ShareActions';
import { siteUrl } from '@/lib/site';
import Markdown from '@/components/Markdown';

export const revalidate = 0;

const STATUS_MESSAGES: Record<string, string> = {
  submitted: 'Waiting for an editor to pick this up.',
  under_review: 'An editor is reviewing this now.',
  approved: 'Approved — an editor will publish or schedule it shortly.',
  scheduled: 'Approved and scheduled to publish automatically.',
  published: 'Live on the site.',
  rejected: "This article wasn't accepted. See the editor's note below.",
  archived: 'This article has been archived.',
};

export default async function ArticleViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireContributor();
  const supabase = await createClient();

  const { data: post } = await supabase.from('posts').select('*').eq('id', id).single();
  if (!post || post.author_id !== profile.id) notFound();

  const { data: history } = await supabase
    .from('review_history')
    .select('id, action, feedback, created_at, profiles(display_name)')
    .eq('post_id', id)
    .order('created_at', { ascending: false });

  const editable = ['draft', 'changes_requested'].includes(post.status);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 [overflow-wrap:anywhere]">
      <Link href="/dashboard/articles" className="text-xs text-muted hover:text-brand font-medium">
        &larr; Back to My Articles
      </Link>

      <h1 className="font-display font-900 text-2xl mt-4 mb-2">{post.title}</h1>

      <div className="border-2 border-line bg-white px-4 py-3 mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Status</p>
        <p className="font-semibold capitalize">{post.status.replace('_', ' ')}</p>
        <p className="text-sm text-muted mt-1">{STATUS_MESSAGES[post.status] ?? ''}</p>
        {post.status === 'scheduled' && post.scheduled_at && (
          <p className="text-sm mt-2">
            Goes live: <strong>{new Date(post.scheduled_at).toLocaleString()}</strong>
          </p>
        )}
      </div>

      {editable && (
        <Link
          href={`/dashboard/articles/${post.id}/edit`}
          className="inline-block bg-ink text-white px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-brand transition-colors mb-6"
        >
          Edit this article
        </Link>
      )}

      {post.status === "published" && <section className="mb-8 rounded-2xl border border-line p-5"><h2 className="mb-4 font-display text-xl font-bold">Share your published story</h2><ShareActions title={post.title} url={siteUrl("/blog/" + encodeURIComponent(post.slug))} excerpt={post.excerpt} /></section>}

      <h2 className="font-display font-700 text-lg mb-3">Editorial history</h2>
      {!history || history.length === 0 ? (
        <p className="text-sm text-muted mb-8">No editorial activity yet.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line mb-8">
          {history.map((h: any) => (
            <li key={h.id} className="py-3">
              <p className="text-sm">
                <span className="font-semibold">{h.profiles?.display_name ?? 'Someone'}</span>{' '}
                <span className="capitalize">{h.action.replace('_', ' ')}</span>
              </p>
              {h.feedback && (
                <p className="text-sm bg-gold/10 border-l-2 border-gold px-3 py-2 mt-2">{h.feedback}</p>
              )}
              <p className="text-xs text-muted mt-1">{formatDate(h.created_at)}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="font-display font-700 text-lg mb-3">Article</h2>
      <div className="border-2 border-line bg-white px-6 py-6">
        <Markdown content={post.content} />
      </div>
    </div>
  );
}