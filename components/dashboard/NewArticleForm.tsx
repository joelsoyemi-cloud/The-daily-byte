"use client";

import type { SchoolOption } from "@/lib/schools";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostForm, { type ArticleValues } from "@/components/PostForm";
import { storySaveError } from "@/lib/student-errors";

export default function NewArticleForm({
  categories,
  schools,
  defaultSchoolId,
}: {
  categories: { id: string; name: string }[];
  schools: SchoolOption[];
  defaultSchoolId: string | null;

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
    if (!user) throw new Error("Your session has expired. Sign in again in another tab, then retry. Keep this page open to preserve your writing.");

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title: values.title,
        slug: values.slug,
        category_id: values.category_id || null,
        school_id: values.school_id || null,
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

    if (error || !post) throw new Error(storySaveError(error));

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
      headingLevel="h2"
      categories={categories}
      schools={schools}
      initialValues={{ school_id: schools.some(s => s.id === defaultSchoolId) ? defaultSchoolId ?? "" : "" }}
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
