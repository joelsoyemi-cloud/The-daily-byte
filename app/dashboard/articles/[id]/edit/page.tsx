import { getSchoolOptions } from "@/lib/schools-server";
import { notFound } from "next/navigation";
import { requireContributor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EditArticleForm from "@/components/dashboard/EditArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireContributor();
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

  if (!post || post.author_id !== profile.id) notFound();
  if (!["draft", "changes_requested"].includes(post.status)) {
    notFound();
  }

  const { data: lastReview } = await supabase
    .from("review_history")
    .select("feedback")
    .eq("post_id", id)
    .eq("action", "changes_requested")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <EditArticleForm
      postId={post.id}
      categories={categories ?? []}
      schools={await getSchoolOptions()}
      reviewerNote={lastReview?.feedback ?? null}
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
