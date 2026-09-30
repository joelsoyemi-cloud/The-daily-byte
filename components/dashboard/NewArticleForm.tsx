"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostForm, { type ArticleValues } from "@/components/PostForm";

export default function NewArticleForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();

  async function insertAs(
    status: "draft" | "submitted",
    values: ArticleValues,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title: values.title,
        slug: values.slug,
        category_id: values.category_id || null,
        content_type: values.content_type,
        excerpt: values.excerpt || null,
        cover_image: values.cover_image || null,
        content: values.content,
        tags: values.tags,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        author_id: user.id,
        status,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    if (status === "submitted") {
      await supabase.from("review_history").insert({
        post_id: post.id,
        reviewer_id: user.id,
        action: "submitted",
      });
    }

    router.push("/dashboard/articles");
    router.refresh();
  }

  return (
    <PostForm
      categories={categories}
      allowEditorialFields={false}
      actions={[
        {
          label: "Save draft",
          variant: "secondary",
          onClick: (v) => insertAs("draft", v),
        },
        {
          label: "Submit for review",
          variant: "primary",
          onClick: (v) => insertAs("submitted", v),
        },
      ]}
    />
  );
}
