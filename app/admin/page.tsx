import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStoryCounts, NEWSROOM_STORY_SELECT, type NewsroomStory } from "@/lib/newsroom";
import { statusLabel } from "@/lib/workspaces";
import { PageHeading, Metric, Panel, RoleBadge, StatusBadge, StoryList } from "@/components/dashboard/WorkspaceUI";
import type { Role } from "@/lib/auth";
export const revalidate = 0;
type RecentUser = { id: string; display_name: string; role: Role; status: string; created_at: string };
const managementGroups = [
  { title: "Publishing", links: [["/editor/submissions", "Editorial Queue"], ["/editor/articles", "Articles"], ["/editor/categories", "Categories"], ["/editor/media", "Media"], ["/editor/activity", "Review Activity"]] },
  { title: "People & platform", links: [["/admin/feedback", "Feedback & reports"], ["/admin/schools", "Schools"], ["/admin/users", "Users"], ["/admin/roles", "Roles"], ["/admin/settings", "Platform Settings"], ["/admin/advertising", "Advertising"]] },
  { title: "Workspaces & publication", links: [["/dashboard", "Writing Workspace"], ["/editor", "Editorial Workspace"], ["/", "Public Site"]] },
];
export default async function AdminOverview() {
  await requireAdmin();
  const supabase = await createClient();
  const countUsers = async (roles?: string[]) => {
    let query = supabase.from("profiles").select("id", { count: "exact", head: true });
    if (roles) query = query.in("role", roles);
    const { count, error } = await query;
    return error ? null : count;
  };
  const [users, contributors, editors, admins, counts, recent, stories, feedback, submissions] = await Promise.all([
    countUsers(), countUsers(["contributor", "author"]), countUsers(["editor"]), countUsers(["admin"]), getStoryCounts(),
    supabase.from("profiles").select("id, display_name, role, status, created_at").order("created_at", { ascending: false }).order("id").limit(6).returns<RecentUser[]>(),
    supabase.from("posts").select(NEWSROOM_STORY_SELECT).order("updated_at", { ascending: false }).order("id").limit(6).returns<NewsroomStory[]>(),
    supabase.from("feedback_submissions").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing"]),
    supabase.from("review_history").select("id, post_id, created_at, posts(title)").eq("action", "submitted").order("created_at", { ascending: false }).order("id").limit(6).returns<{ id: string; post_id: string; created_at: string; posts: { title: string } | null }[]>(),
  ]);
  if (recent.error) throw new Error("Unable to load recent users.");
  const submitted = counts.find(row => row.status === "submitted")?.value;
  const reviewing = counts.find(row => row.status === "under_review")?.value;
  const workload = submitted != null && reviewing != null ? submitted + reviewing : null;
  return <div><PageHeading eyebrow="Admin Workspace" title="Your platform command center." description="Manage the people, publishing, and operations behind The Daily Byte." />
    <nav aria-label="Admin quick actions" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["/dashboard/articles/new", "Create Story"], ["/editor/submissions", "Review Submissions"], ["/admin/users", "Manage Users"], ["/admin/feedback", "Review Feedback"]].map(([href, label], index) => <Link key={href} href={href} className={"nr-button " + (index === 0 ? "nr-button-primary" : "nr-button-secondary")}>{label}<span aria-hidden="true">↗</span></Link>)}
    </nav>
    <div className="nr-metrics"><Metric label="Total users" value={users} /><Metric label="Contributors & authors" value={contributors} tone="teal" /><Metric label="Editors" value={editors} tone="gold" /><Metric label="Admins" value={admins} tone="red" /></div>
    <div className="mb-6"><Metric label="Unresolved feedback" value={feedback.error ? null : feedback.count} href="/admin/feedback" tone="gold" /></div>
    <Panel title="Recent submissions" description="Real submission events, including resubmissions." action={{ href: "/editor/submissions", label: "Review submissions" }}>{submissions.error ? <p className="p-6 text-sm text-muted">Recent submissions are temporarily unavailable.</p> : submissions.data?.length ? <ul>{submissions.data.map(item => <li key={item.id} className="nr-story-row"><Link className="min-w-0 font-semibold [overflow-wrap:anywhere]" href={"/editor/articles/" + encodeURIComponent(item.post_id) + "/edit"}>{item.posts?.title || "Story no longer available"}</Link><time className="text-xs text-muted" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}</time></li>)}</ul> : <p className="p-6 text-sm text-muted">No submission events yet.</p>}</Panel>
    <div className="grid grid-cols-1 gap-x-5 lg:grid-cols-3">    {managementGroups.map(group => <Panel key={group.title} title={group.title}><div className="nr-action-list">{group.links.map(([href, label]) => <Link key={href} href={href}>{label}<span aria-hidden="true">↗</span></Link>)}</div></Panel>)}</div>
    <div className="nr-overview-grid"><div><Panel title="Content across the newsroom" description="Every stage of the editorial process." action={{ href: "/editor/articles", label: "All articles" }}><ul className="grid grid-cols-2 gap-x-6 px-6 py-4 sm:grid-cols-3">{counts.map(row => <li key={row.status}><Link href={"/editor/articles?status=" + row.status} className="flex min-h-16 flex-col justify-center gap-1 py-3"><span className="text-xs text-muted">{statusLabel(row.status)}</span><strong className="font-display text-xl">{row.value ?? "Unavailable"}</strong></Link></li>)}</ul></Panel>
    <Panel title="Recently updated stories" description="The latest work across the publication." action={{ href: "/editor/articles", label: "All articles" }}>{stories.error ? <p className="p-6 text-sm text-muted">Recent stories are temporarily unavailable.</p> : stories.data?.length ? <StoryList posts={stories.data} editorial /> : <p className="p-6 text-sm text-muted">No stories to show yet.</p>}</Panel>
    <Panel title="Recent signups" description="The latest contributor profiles created on the platform." action={{ href: "/admin/users", label: "Manage users" }}><ul>{(recent.data ?? []).map(user => <li key={user.id} className="nr-story-row"><div><p className="font-semibold mb-2">{user.display_name || "Unnamed user"}</p><div className="flex flex-wrap gap-2"><RoleBadge role={user.role} /><StatusBadge status={user.status} /></div></div><time className="text-xs text-muted" dateTime={user.created_at}>{new Date(user.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}</time></li>)}</ul>{!recent.data?.length && <p className="p-6 text-sm text-muted">No users to show.</p>}</Panel></div>
    <div><section className="nr-callout"><p className="nr-eyebrow">Editorial workload</p><h2>{workload === null ? "Count unavailable" : workload + " " + (workload === 1 ? "story" : "stories") + " awaiting review"}</h2><p>Submitted and under-review stories need the editorial team’s attention.</p><Link href="/editor/submissions" className="nr-text-link">Open editorial queue →</Link></section>
</div></div>
  </div>;
}
