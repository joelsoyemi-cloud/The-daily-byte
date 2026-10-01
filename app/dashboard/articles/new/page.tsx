import { requireContributor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import NewArticleForm from "@/components/dashboard/NewArticleForm";
import { PageHeading } from "@/components/dashboard/WorkspaceUI";
export default async function NewArticlePage() {
  await requireContributor();
  const supabase = await createClient();
  const { data: categories, error } = await supabase.from("categories").select("id, name").order("name");
  if (error) throw new Error("Unable to load story categories.");
  return <div><PageHeading eyebrow="Writing Workspace" title="Create a story" description="Start with a strong idea. Save a draft at any time, or submit your finished story for editorial review." create={false} /><NewArticleForm categories={categories ?? []} /></div>;
}
