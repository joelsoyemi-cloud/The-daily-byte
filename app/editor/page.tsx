import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStoryCounts, NEWSROOM_STORY_SELECT, type NewsroomStory } from "@/lib/newsroom";
import { statusLabel } from "@/lib/workspaces";
import { PageHeading, Metric, Panel, StoryList } from "@/components/dashboard/WorkspaceUI";
import EmptyState from "@/components/dashboard/EmptyState";
export const revalidate = 0;
export default async function EditorOverview() {
  await requireEditor();
  const supabase = await createClient();
  const [counts, queue] = await Promise.all([
    getStoryCounts(),
    supabase.from("posts").select(NEWSROOM_STORY_SELECT).in("status", ["submitted", "under_review"]).order("updated_at", { ascending: true }).order("id").limit(6).returns<NewsroomStory[]>(),
  ]);
  if (queue.error) throw new Error("Unable to load the editorial queue.");
  return <div><PageHeading eyebrow="The editorial desk" title="Good stories. Ready for a closer look." description="Review the queue, support your writers, and keep the publication moving." />
    <div className="nr-metrics">{counts.filter(row => ["submitted", "under_review", "changes_requested", "approved", "scheduled", "published"].includes(row.status)).map(row => <Metric key={row.status} label={statusLabel(row.status)} value={row.value} href={"/editor/articles?status=" + row.status} tone={row.status === "changes_requested" || row.status === "scheduled" ? "gold" : row.status === "approved" || row.status === "published" ? "teal" : "red"} />)}</div>
    <div className="nr-overview-grid"><Panel title="Editorial queue" description="Oldest updates first. Open a story to review its content." action={{ href: "/editor/submissions", label: "Full queue" }}>{queue.data?.length ? <StoryList posts={queue.data} editorial /> : <EmptyState message="The queue is clear. New submissions will appear here." />}</Panel>
    <div><Panel title="From the editor’s desk"><div className="nr-action-list"><Link href="/editor/articles?status=approved">Ready to publish <span aria-hidden="true">↗</span></Link><Link href="/editor/articles?status=scheduled">Scheduled stories <span aria-hidden="true">↗</span></Link><Link href="/editor/activity">Review activity <span aria-hidden="true">↗</span></Link><Link href="/editor/authors">Meet the writers <span aria-hidden="true">↗</span></Link></div></Panel><section className="nr-callout"><h2>Have a story of your own?</h2><p>Your own drafts live in the Writing Workspace. Your editorial role stays with you.</p><Link href="/dashboard/articles/new" className="nr-text-link">+ Create Story</Link></section></div></div>
  </div>;
}
