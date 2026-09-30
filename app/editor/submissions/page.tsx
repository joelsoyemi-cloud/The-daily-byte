import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/dashboard/EmptyState";
import SubmissionRow from "@/components/editor/SubmissionRow";

export const revalidate = 0;

export default async function SubmissionQueuePage() {
  await requireEditor();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, title, slug, status, content_type, updated_at, profiles(display_name), categories(name)",
    )
    .in("status", ["submitted", "under_review"])
    .order("updated_at", { ascending: true });

  const ids = (posts ?? []).map((p) => p.id);
  const historyByPost: Record<
    string,
    { submitted_at: string | null; last_action: string | null }
  > = {};

  if (ids.length > 0) {
    const { data: history } = await supabase
      .from("review_history")
      .select("post_id, action, created_at")
      .in("post_id", ids)
      .order("created_at", { ascending: false });

    for (const id of ids) {
      const rows = (history ?? []).filter((h) => h.post_id === id);
      const lastSubmitted = rows.find((h) => h.action === "submitted");
      historyByPost[id] = {
        submitted_at: lastSubmitted?.created_at ?? null,
        last_action: rows[0]?.action ?? null,
      };
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Submission Queue</h1>

      {!posts || posts.length === 0 ? (
        <EmptyState message="Nothing waiting for review." />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {posts.map((post: any) => (
            <SubmissionRow
              key={post.id}
              post={{
                ...post,
                submitted_at: historyByPost[post.id]?.submitted_at ?? null,
                last_action: historyByPost[post.id]?.last_action ?? null,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
