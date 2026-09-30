import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminOverview() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { count: userCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: publishedCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const { count: pendingCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .in("status", ["submitted", "under_review"]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-2">Admin Overview</h1>
      <p className="text-muted text-sm mb-8">
        Signed in as {profile.display_name}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="border-2 border-line px-4 py-4 bg-white">
          <p className="text-2xl font-display font-900">{userCount ?? 0}</p>
          <p className="text-xs text-muted font-medium mt-1">Total Users</p>
        </div>
        <div className="border-2 border-line px-4 py-4 bg-white">
          <p className="text-2xl font-display font-900">
            {publishedCount ?? 0}
          </p>
          <p className="text-xs text-muted font-medium mt-1">
            Published Articles
          </p>
        </div>
        <div className="border-2 border-line px-4 py-4 bg-white">
          <p className="text-2xl font-display font-900">{pendingCount ?? 0}</p>
          <p className="text-xs text-muted font-medium mt-1">Awaiting Review</p>
        </div>
      </div>
    </div>
  );
}
