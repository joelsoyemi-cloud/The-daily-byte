import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CategoriesManager from "@/components/editor/CategoriesManager";

export const revalidate = 0;

export default async function CategoriesPage() {
  await requireEditor();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Categories</h1>
      <CategoriesManager categories={categories ?? []} />
    </div>
  );
}
