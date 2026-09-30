import { createClient } from "@/lib/supabase/server";
import NewArticleForm from "@/components/dashboard/NewArticleForm";

export default async function NewArticlePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return <NewArticleForm categories={categories ?? []} />;
}
