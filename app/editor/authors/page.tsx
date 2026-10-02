import Avatar from "@/components/Avatar";
import { requireEditor, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { newsroomPage } from "@/lib/newsroom";
import { PageHeading, Panel, RoleBadge, StatusBadge, ListPagination } from "@/components/dashboard/WorkspaceUI";
import EmptyState from "@/components/dashboard/EmptyState";
export const revalidate = 0;
type Author = { avatar_url: string | null; id: string; display_name: string; role: Role; status: string; created_at: string };
export default async function AuthorsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireEditor();
  const page = newsroomPage((await searchParams).page);
  const supabase = await createClient();
  const { data, count, error } = await supabase.from("profiles").select("id, avatar_url, display_name, role, status, created_at", { count: "exact" }).in("role", ["contributor", "author"]).order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1).returns<Author[]>();
  if (error) throw new Error("Unable to load writers.");
  return <div><PageHeading eyebrow="People behind the stories" title="Authors" description="The contributors and authors building your publication." /><Panel title="Your writing community">{data?.length ? <ul>{data.map(author => <li className="nr-story-row" key={author.id}><Avatar url={author.avatar_url} name={author.display_name} size={40} /><div className="min-w-0"><h3>{author.display_name || "Unnamed writer"}</h3><div className="flex flex-wrap gap-2"><RoleBadge role={author.role} /><StatusBadge status={author.status} /></div></div><p className="text-xs text-muted">Joined <time dateTime={author.created_at}>{new Date(author.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}</time></p></li>)}</ul> : <EmptyState message="New contributors will appear here when they join." />}</Panel><ListPagination base="/editor/authors" page={page} total={count ?? 0} /></div>;
}
