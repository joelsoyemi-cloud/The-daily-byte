import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/dashboard/EmptyState";

export const revalidate = 0;

export default async function EditorOverview() {
  const profile = await requireEditor();
  const supabase = await createClient();

  const { count: pendingCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .in("status", ["submitted", "under_review"]);

  const { count: publishedCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const { count: authorCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["contributor", "author"]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-2">
        Editorial Overview
      </h1>
      <p className="text-muted text-sm mb-8">
        Signed in as {profile.display_name}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="border-2 border-line px-4 py-4 bg-white">
          <p className="text-2xl font-display font-900">{pendingCount ?? 0}</p>
          <p className="text-xs text-muted font-medium mt-1">Awaiting Review</p>
        </div>
        <div className="border-2 border-line px-4 py-4 bg-white">
          <p className="text-2xl font-display font-900">
            {publishedCount ?? 0}
          </p>
          <p className="text-xs text-muted font-medium mt-1">Published</p>
        </div>
        <div className="border-2 border-line px-4 py-4 bg-white">
          <p className="text-2xl font-display font-900">{authorCount ?? 0}</p>
          <p className="text-xs text-muted font-medium mt-1">Contributors</p>
        </div>
      </div>

      {(pendingCount ?? 0) === 0 ? (
        <EmptyState message="Nothing waiting for review right now." />
      ) : (
        <Link
          href="/editor/submissions"
          className="inline-block bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors"
        >
          Go to Submission Queue →
        </Link>
      )}
    </div>
  );
}
