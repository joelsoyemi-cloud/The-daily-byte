import Link from "next/link";
import { requireContributor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/posts";
import EmptyState from "@/components/dashboard/EmptyState";

export const revalidate = 0;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "changes_requested", label: "Changes Requested" },
  { key: "approved", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
] as const;

export default async function MyArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = FILTERS.find((f) => f.key === status)?.key ?? "all";
  const profile = await requireContributor();
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, title, slug, status, updated_at")
    .eq("author_id", profile.id)
    .order("updated_at", { ascending: false });

  if (activeFilter !== "all") query = query.eq("status", activeFilter);

  const { data: posts } = await query;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-900 text-2xl">My Articles</h1>
        <Link
          href="/dashboard/articles/new"
          className="bg-ink text-white px-4 py-2 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors"
        >
          + New
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b-2 border-ink pb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={
              f.key === "all"
                ? "/dashboard/articles"
                : `/dashboard/articles?status=${f.key}`
            }
            className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 ${
              activeFilter === f.key
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!posts || posts.length === 0 ? (
        <EmptyState
          message="Nothing here yet."
          actionLabel="Write an article"
          actionHref="/dashboard/articles/new"
        />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {posts.map((post) => {
            const editable = ["draft", "changes_requested"].includes(
              post.status,
            );
            return (
              <li
                key={post.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{post.title}</p>
                  <p className="text-xs text-muted mt-1">
                    {post.status.replace("_", " ")} &middot;{" "}
                    {formatDate(post.updated_at)}
                  </p>
                </div>
                {editable ? (
                  <Link
                    href={`/dashboard/articles/${post.id}/edit`}
                    className="text-xs font-bold uppercase tracking-wide text-brand hover:underline shrink-0"
                  >
                    Edit
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/articles/${post.id}`}
                    className="text-xs font-bold uppercase tracking-wide text-muted hover:text-ink shrink-0"
                  >
                    View
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
