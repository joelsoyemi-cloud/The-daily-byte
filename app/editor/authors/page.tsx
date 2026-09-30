import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/dashboard/EmptyState";

export const revalidate = 0;

export default async function AuthorsPage() {
  await requireEditor();
  const supabase = await createClient();

  const { data: authors } = await supabase
    .from("profiles")
    .select("id, display_name, role, status, created_at")
    .in("role", ["contributor", "author"])
    .order("created_at", { ascending: false });

  const counts: Record<string, number> = {};
  if (authors && authors.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("author_id")
      .in(
        "author_id",
        authors.map((a) => a.id),
      );
    for (const p of posts ?? []) {
      counts[p.author_id] = (counts[p.author_id] ?? 0) + 1;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Authors</h1>

      {!authors || authors.length === 0 ? (
        <EmptyState message="No contributors have signed up yet." />
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {authors.map((a) => (
            <li key={a.id} className="py-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{a.display_name}</p>
                <p className="text-xs text-muted mt-1 capitalize">
                  {a.role} &middot; {a.status}
                </p>
              </div>
              <p className="text-sm text-muted">{counts[a.id] ?? 0} articles</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
