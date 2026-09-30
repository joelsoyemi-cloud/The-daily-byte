import Link from "next/link";
import { requireContributor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/dashboard/EmptyState";

export const revalidate = 0;

export default async function DashboardOverview() {
  const profile = await requireContributor();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("status")
    .eq("author_id", profile.id);

  const counts = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    changes_requested: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    rejected: 0,
  };
  for (const p of posts ?? []) {
    if (p.status in counts) counts[p.status as keyof typeof counts]++;
  }

  const total = posts?.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-2">
        Welcome back, {profile.display_name}
      </h1>
      <p className="text-muted text-sm mb-8">
        Here's where your articles stand.
      </p>

      {total === 0 ? (
        <EmptyState
          message="You haven't written anything yet."
          actionLabel="Write your first article"
          actionHref="/dashboard/articles/new"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              ["Drafts", counts.draft],
              ["Submitted", counts.submitted],
              ["Under Review", counts.under_review],
              ["Changes Requested", counts.changes_requested],
              ["Approved", counts.approved],
              ["Scheduled", counts.scheduled],
              ["Published", counts.published],
              ["Rejected", counts.rejected],
            ] as const
          ).map(([label, count]) => (
            <div
              key={label}
              className="border-2 border-line px-4 py-4 bg-white"
            >
              <p className="text-2xl font-display font-900">{count}</p>
              <p className="text-xs text-muted font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/dashboard/articles/new"
          className="inline-block bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors"
        >
          + New Article
        </Link>
      </div>
    </div>
  );
}
