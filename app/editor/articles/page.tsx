import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/posts";
import EmptyState from "@/components/dashboard/EmptyState";

export const revalidate = 0;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "changes_requested", label: "Changes Requested" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
  { key: "rejected", label: "Rejected" },
] as const;

export default async function EditorArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = FILTERS.find((f) => f.key === status)?.key ?? "all";
  await requireEditor();
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, title, status, updated_at, profiles(display_name)")
    .order("updated_at", { ascending: false });

  if (activeFilter !== "all") query = query.eq("status", activeFilter);

  const { data: posts } = await query;

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">All Articles</h1>

      <div className="flex flex-wrap gap-2 mb-6 border-b-2 border-ink pb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={
              f.key === "all"
                ? "/editor/articles"
                : `/editor/articles?status=${f.key}`
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
        <EmptyState message="No articles match this filter." />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {posts.map((post: any) => (
            <li
              key={post.id}
              className="py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{post.title}</p>
                <p className="text-xs text-muted mt-1">
                  by {post.profiles?.display_name ?? "Unknown"} &middot;{" "}
                  {post.status.replace("_", " ")} &middot;{" "}
                  {formatDate(post.updated_at)}
                </p>
              </div>
              <Link
                href={`/editor/articles/${post.id}/edit`}
                className="text-xs font-bold uppercase tracking-wide text-brand hover:underline shrink-0"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
