import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeading, Panel, StatusBadge } from "@/components/dashboard/WorkspaceUI";
import EmptyState from "@/components/dashboard/EmptyState";
export const revalidate = 0;
type Activity = { id: string; action: string; feedback: string | null; created_at: string; posts: { title: string } | null; profiles: { display_name: string } | null };
export default async function ActivityPage() {
  await requireEditor();
  const supabase = await createClient();
  const { data, error } = await supabase.from("review_history").select("id, action, feedback, created_at, posts(title), profiles(display_name)").order("created_at", { ascending: false }).order("id").limit(50).returns<Activity[]>();
  if (error) throw new Error("Unable to load review activity.");
  return <div><PageHeading eyebrow="The newsroom record" title="Review activity" description="The 50 most recent editorial decisions. This permanent record cannot be edited or deleted, including by admins." /><Panel title="Latest decisions">{data?.length ? <ol>{data.map(item => <li key={item.id} className="nr-story-row"><div><div className="flex flex-wrap items-center gap-3 mb-3"><StatusBadge status={item.action} /><span className="text-xs text-muted">{item.profiles?.display_name || "Unknown reviewer"}</span></div><p className="font-display font-bold">{item.posts?.title || "Story no longer available"}</p>{item.feedback && <blockquote className="mt-3 border-l-2 border-gold bg-surface px-4 py-3 text-sm leading-relaxed">{item.feedback}</blockquote>}</div><time className="text-xs text-muted" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC</time></li>)}</ol> : <EmptyState message="Editorial decisions will appear here once the first story is reviewed." />}</Panel></div>;
}
