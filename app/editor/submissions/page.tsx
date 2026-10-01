import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { newsroomPage } from "@/lib/newsroom";
import EmptyState from "@/components/dashboard/EmptyState";
import { PageHeading, Panel, ListPagination } from "@/components/dashboard/WorkspaceUI";
import SubmissionRow, { type Submission } from "@/components/editor/SubmissionRow";
export const revalidate = 0;
type QueueStory = Omit<Submission, "submitted_at" | "last_action"> & { submission: { created_at: string }[]; recent_review: { action: string }[] };
export default async function SubmissionQueuePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireEditor();
  const page = newsroomPage((await searchParams).page);
  const supabase = await createClient();
  const { data: posts, count, error } = await supabase.from("posts")
    .select("id, title, slug, status, content_type, updated_at, profiles(display_name), categories(name), schools(name), submission:review_history(created_at), recent_review:review_history(action)", { count: "exact" })
    .in("status", ["submitted", "under_review"])
    // These embedded filters limit history records only, not the parent queue.
    .eq("submission.action", "submitted")
    .order("created_at", { referencedTable: "submission", ascending: false }).limit(1, { referencedTable: "submission" })
    .order("created_at", { referencedTable: "recent_review", ascending: false }).limit(1, { referencedTable: "recent_review" })
    .order("updated_at", { ascending: true }).order("id")
    .range((page - 1) * 20, page * 20 - 1).returns<QueueStory[]>();
  if (error) throw new Error("Unable to load the submission queue.");
  return <div><PageHeading eyebrow="The review desk" title="Editorial queue" description="Submitted and under-review stories, ordered by their oldest update. Read the story before taking an editorial action." /><Panel title="Ready for your review" description="Your review decisions and feedback remain in the activity history.">{posts?.length ? <ul>{posts.map(({ submission, recent_review, ...post }) => <SubmissionRow key={post.id} post={{ ...post, submitted_at: submission?.[0]?.created_at ?? null, last_action: recent_review?.[0]?.action ?? null }} />)}</ul> : <EmptyState message="Nothing waiting for review. The queue is clear." />}</Panel><ListPagination base="/editor/submissions" page={page} total={count ?? 0} /></div>;
}
