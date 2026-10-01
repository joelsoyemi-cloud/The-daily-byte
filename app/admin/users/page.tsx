import { requireAdmin, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { newsroomPage } from "@/lib/newsroom";
import { PageHeading, ListPagination } from "@/components/dashboard/WorkspaceUI";
import UsersTable from "@/components/admin/UsersTable";
export const revalidate = 0;
type UserRow = { id: string; display_name: string; role: Role; status: string };
export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const profile = await requireAdmin();
  const page = newsroomPage((await searchParams).page);
  const supabase = await createClient();
  const { data, count, error } = await supabase.from("profiles").select("id, display_name, role, status", { count: "exact" }).order("display_name").order("id").range((page - 1) * 20, page * 20 - 1).returns<UserRow[]>();
  if (error) throw new Error("Unable to load users.");
  return <div><PageHeading eyebrow="People & access" title="Manage users" description="Assign roles and manage account access. Your own role and status stay protected." /><UsersTable users={data ?? []} currentUserId={profile.id} /><ListPagination base="/admin/users" page={page} total={count ?? 0} /></div>;
}
