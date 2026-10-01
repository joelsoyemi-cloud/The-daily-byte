import { getSchoolOptions } from "@/lib/schools-server";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EditorArticleForm from "@/components/editor/EditorArticleForm";

export default async function EditorEditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireEditor();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (!post) notFound();

  return (
    <EditorArticleForm
      postId={post.id}
      currentStatus={post.status}
      categories={categories ?? []}
      schools={await getSchoolOptions()}
      initialValues={{
        school_id: post.school_id ?? "",
        title: post.title,
        slug: post.slug,
        category_id: post.category_id ?? "",
        content_type: post.content_type ?? "news",
        excerpt: post.excerpt ?? "",
        cover_image: post.cover_image ?? "",
        content: post.content,
        tags: post.tags ?? [],
        seo_title: post.seo_title ?? "",
        seo_description: post.seo_description ?? "",
        featured: post.featured ?? false,
        breaking: post.breaking ?? false,
      }}
    />
  );
}
