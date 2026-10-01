import { getSchoolOptions } from "@/lib/schools-server";
import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NEWSROOM_STORY_SELECT, newsroomPage, type NewsroomStory } from "@/lib/newsroom";
import { STORY_STATUSES } from "@/lib/workspaces";
import { PageHeading, StoryFilters, Panel, StoryList, ListPagination } from "@/components/dashboard/WorkspaceUI";
import EmptyState from "@/components/dashboard/EmptyState";
export const revalidate = 0;
export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; school?: string }> }) {
  await requireEditor();
  const params = await searchParams;
  const status = STORY_STATUSES.find(value => value === params.status) ?? "all";
  const page = newsroomPage(params.page);
  const schools = await getSchoolOptions();
  const school = schools.find(s => s.id === params.school)?.id;
  const supabase = await createClient();
  let query = supabase.from("posts").select(NEWSROOM_STORY_SELECT, { count: "exact" }).order("updated_at", { ascending: false }).order("id");
  if (school) query = query.eq("school_id", school);
  if (status !== "all") query = query.eq("status", status);
  const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1).returns<NewsroomStory[]>();
  if (error) throw new Error("Unable to load stories.");
  return <div><PageHeading eyebrow="The editorial library" title="All stories" description="Every story, from first submission to publication. Filter by its place in the editorial process." />
    <form action="/editor/articles" className="mb-5 flex flex-wrap items-end gap-3"><input type="hidden" name="status" value={status} /><div className="min-w-0 flex-1"><label htmlFor="filter-school" className="mb-2 block text-sm font-semibold">School / University</label><select id="filter-school" name="school" defaultValue={school ?? ""} className="w-full border border-line bg-white px-3 py-2"><option value="">All schools / general stories</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><button className="nr-button nr-button-secondary">Apply filter</button></form>
    <StoryFilters base="/editor/articles" active={status} statuses={STORY_STATUSES} school={school} />
    <Panel title="Story library">{data?.length ? <StoryList posts={data} editorial /> : <EmptyState message="No stories match this view." actionLabel="+ Create Story" actionHref="/dashboard/articles/new" />}</Panel>
    <ListPagination base="/editor/articles" page={page} total={count ?? 0} status={status} school={school} />
  </div>;
}
