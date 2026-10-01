"use client";

import type { SchoolOption } from "@/lib/schools";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostForm, { type ArticleValues } from "@/components/PostForm";

export default function EditArticleForm({
  postId,
  categories,
  schools,
  initialValues,
  reviewerNote,
}: {
  postId: string;
  categories: { id: string; name: string }[];
  schools: SchoolOption[];
  initialValues: ArticleValues;
  reviewerNote: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function updateAs(
    status: "draft" | "submitted",
    values: ArticleValues,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");

    const { error } = await supabase
      .from("posts")
      .update({
        title: values.title,
        slug: values.slug,
        category_id: values.category_id || null,
        school_id: values.school_id || null,
        excerpt: values.excerpt || null,
        cover_image: values.cover_image || null,
        content: values.content,
        status,
      })
      .eq("id", postId);

    if (error) throw new Error(error.message);

    if (status === "submitted") {
      await supabase.from("review_history").insert({
        post_id: postId,
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
      schools={schools}
      initialValues={initialValues}
      reviewerNote={reviewerNote}
      actions={[
        {
          label: "Save draft",
          variant: "secondary",
          onClick: (v) => updateAs("draft", v),
        },
        {
          label: "Resubmit for review",
          variant: "primary",
          onClick: (v) => updateAs("submitted", v),
        },
      ]}
    />
  );
}
