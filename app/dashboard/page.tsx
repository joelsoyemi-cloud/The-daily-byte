import Link from "next/link";
import { requireContributor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStoryCounts, NEWSROOM_STORY_SELECT, type NewsroomStory } from "@/lib/newsroom";
import { statusLabel } from "@/lib/workspaces";
import { PageHeading, Metric, Panel, StoryList } from "@/components/dashboard/WorkspaceUI";
import EmptyState from "@/components/dashboard/EmptyState";
export const revalidate = 0;
export default async function DashboardOverview() {
  const profile = await requireContributor();
  const supabase = await createClient();
  const [counts, recent] = await Promise.all([
    getStoryCounts(profile.id),
    supabase.from("posts").select(NEWSROOM_STORY_SELECT).eq("author_id", profile.id).order("updated_at", { ascending: false }).order("id").limit(6).returns<NewsroomStory[]>(),
  ]);
  if (recent.error) throw new Error("Unable to load your stories.");
  const changes = counts.find(row => row.status === "changes_requested")?.value;
  return <div><PageHeading eyebrow="Your byline starts here" title={"Welcome back, " + (profile.display_name || "writer") + "."} description="A place for your next idea. Keep writing, follow your submissions, and take your stories to publication." />
    {!!changes && <section className="nr-callout"><h2>{changes} {changes === 1 ? "story needs" : "stories need"} your attention</h2><p>Your editor has requested changes. Open the feedback and get your story ready for another look.</p><Link href="/dashboard/articles?status=changes_requested" className="nr-text-link">Review requested changes →</Link></section>}
    <div className="nr-metrics">{counts.filter(row => ["draft", "submitted", "changes_requested", "published"].includes(row.status)).map(row => <Metric key={row.status} label={statusLabel(row.status)} value={row.value} href={"/dashboard/articles?status=" + row.status} tone={row.status === "changes_requested" ? "gold" : row.status === "published" ? "teal" : row.status === "draft" ? "red" : "ink"} />)}</div>
    <div className="nr-overview-grid"><Panel title="Your recent stories" description="Your latest writing and editorial updates." action={{ href: "/dashboard/articles", label: "All stories" }}>{recent.data?.length ? <StoryList posts={recent.data} /> : <EmptyState message="Your next story starts with an idea. Create your first draft when you are ready." actionHref="/dashboard/articles/new" actionLabel="+ Create Story" />}</Panel>
    <div><Panel title="Keep things moving"><div className="nr-action-list"><Link href="/dashboard/articles?status=draft">Continue a draft <span aria-hidden="true">↗</span></Link><Link href="/dashboard/articles?status=changes_requested">Review editor feedback <span aria-hidden="true">↗</span></Link><Link href="/dashboard/headlines">Explore today’s headlines <span aria-hidden="true">↗</span></Link><Link href="/dashboard/profile">Update your byline <span aria-hidden="true">↗</span></Link></div></Panel>
    <Panel title="Following your submissions"><ul className="px-6 py-3">{counts.filter(row => !["draft", "submitted", "changes_requested", "published"].includes(row.status)).map(row => <li key={row.status}><Link className="flex min-h-11 items-center justify-between gap-4 text-xs" href={"/dashboard/articles?status=" + row.status}><span>{statusLabel(row.status)}</span><strong>{row.value ?? "Unavailable"}</strong></Link></li>)}</ul></Panel></div></div>
  </div>;
}
