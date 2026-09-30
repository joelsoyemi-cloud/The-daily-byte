import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/posts";
import EmptyState from "@/components/dashboard/EmptyState";

export const revalidate = 0;

export default async function ActivityPage() {
  await requireEditor();
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("review_history")
    .select(
      "id, action, feedback, created_at, posts(title), profiles(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-2">Review Activity</h1>
      <p className="text-muted text-sm mb-6">
        A permanent record of every editorial decision — nothing here can be
        edited or deleted, including by admins.
      </p>

      {!activity || activity.length === 0 ? (
        <EmptyState message="No review activity yet." />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {activity.map((a: any) => (
            <li key={a.id} className="py-4">
              <p className="text-sm">
                <span className="font-semibold">
                  {a.profiles?.display_name ?? "Someone"}
                </span>{" "}
                <span className="capitalize">{a.action.replace("_", " ")}</span>{" "}
                <span className="font-semibold">
                  {a.posts?.title ?? "a post"}
                </span>
              </p>
              {a.feedback && (
                <p className="text-sm text-muted mt-1 italic">"{a.feedback}"</p>
              )}
              <p className="text-xs text-muted mt-1">
                {formatDate(a.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
