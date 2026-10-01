import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NEWSROOM_STORY_SELECT, newsroomPage, type NewsroomStory } from "@/lib/newsroom";
import { STORY_STATUSES } from "@/lib/workspaces";
import { PageHeading, StoryFilters, Panel, StoryList, ListPagination } from "@/components/dashboard/WorkspaceUI";
import EmptyState from "@/components/dashboard/EmptyState";
export const revalidate = 0;
export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireEditor();
  const params = await searchParams;
  const status = STORY_STATUSES.find(value => value === params.status) ?? "all";
  const page = newsroomPage(params.page);
  const supabase = await createClient();
  let query = supabase.from("posts").select(NEWSROOM_STORY_SELECT, { count: "exact" }).order("updated_at", { ascending: false }).order("id");
  if (status !== "all") query = query.eq("status", status);
  const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1).returns<NewsroomStory[]>();
  if (error) throw new Error("Unable to load stories.");
  return <div><PageHeading eyebrow="The editorial library" title="All stories" description="Every story, from first submission to publication. Filter by its place in the editorial process." />
    <StoryFilters base="/editor/articles" active={status} statuses={STORY_STATUSES} />
    <Panel title="Story library">{data?.length ? <StoryList posts={data} editorial /> : <EmptyState message="No stories match this view." actionLabel="+ Create Story" actionHref="/dashboard/articles/new" />}</Panel>
    <ListPagination base="/editor/articles" page={page} total={count ?? 0} status={status} />
  </div>;
}
