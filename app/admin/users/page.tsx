import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import UsersTable from "@/components/admin/UsersTable";

export const revalidate = 0;

export default async function UsersPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, display_name, role, status")
    .order("display_name");

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Users</h1>
      <UsersTable users={users ?? []} currentUserId={profile.id} />
    </div>
  );
}
