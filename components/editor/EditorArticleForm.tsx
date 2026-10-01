"use client";

import { useState } from "react";
import type { SchoolOption } from "@/lib/schools";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostForm, { type ArticleValues } from "@/components/PostForm";

export default function EditorArticleForm({
  postId,
  categories,
  schools,
  initialValues,
  currentStatus,
}: {
  postId: string;
  categories: { id: string; name: string }[];
  schools: SchoolOption[];
  initialValues: ArticleValues;
  currentStatus: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  async function saveFields(values: ArticleValues) {
    const { error } = await supabase
      .from("posts")
      .update({
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
        featured: values.featured,
        breaking: values.breaking,
      })
      .eq("id", postId);
    if (error) throw new Error(error.message);
  }

  async function transition(
    action: string,
    status: string,
    values: ArticleValues,
    feedback?: string,
  ) {
    await saveFields(values);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");

    const { error } = await supabase
      .from("posts")
      .update({ status })
      .eq("id", postId);
    if (error) throw new Error(error.message);

    await supabase.from("review_history").insert({
      post_id: postId,
      reviewer_id: user.id,
      action,
      feedback: feedback || null,
    });

    router.push("/editor/articles");
    router.refresh();
  }

  async function handleSchedule() {
    if (!scheduleAt) {
      setScheduleError("Pick a date and time first.");
      return;
    }
    const when = new Date(scheduleAt);
    if (when.getTime() <= Date.now()) {
      setScheduleError("Scheduled time must be in the future.");
      return;
    }
    setScheduling(true);
    setScheduleError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { error } = await supabase
        .from("posts")
        .update({ status: "scheduled", scheduled_at: when.toISOString() })
        .eq("id", postId);
      if (error) throw new Error(error.message);

      await supabase.from("review_history").insert({
        post_id: postId,
        reviewer_id: user.id,
        action: "scheduled",
        feedback: `Scheduled for ${when.toLocaleString()}`,
      });

      router.push("/editor/articles");
      router.refresh();
    } catch (err: any) {
      setScheduleError(err.message ?? "Failed to schedule.");
    } finally {
      setScheduling(false);
    }
  }

  const isTerminal = ["published", "archived", "rejected"].includes(
    currentStatus,
  );

  return (
    <div>
      <PostForm
        categories={categories}
        schools={schools}
        initialValues={initialValues}
        allowEditorialFields
        actions={[
          { label: "Save", variant: "secondary", onClick: saveFields },
          ...(isTerminal
            ? []
            : [
                {
                  label: "Approve",
                  variant: "secondary" as const,
                  onClick: (v: ArticleValues) =>
                    transition("approved", "approved", v),
                },
                {
                  label: "Publish Now",
                  variant: "primary" as const,
                  onClick: (v: ArticleValues) =>
                    transition("published", "published", v),
                },
                {
                  label: "Request Changes",
                  variant: "secondary" as const,
                  onClick: (v: ArticleValues) => {
                    const feedback = window.prompt("What needs to change?");
                    if (!feedback) return Promise.resolve();
                    return transition(
                      "changes_requested",
                      "changes_requested",
                      v,
                      feedback,
                    );
                  },
                },
                {
                  label: "Reject",
                  variant: "danger" as const,
                  onClick: (v: ArticleValues) => {
                    const feedback = window.prompt("Reason for rejecting:");
                    if (!feedback) return Promise.resolve();
                    return transition("rejected", "rejected", v, feedback);
                  },
                },
              ]),
        ]}
      />

      {!isTerminal && (
        <div className="max-w-4xl mx-auto px-5 -mt-4 mb-10">
          <div className="border-2 border-line bg-white px-4 py-4 flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                Schedule for later instead
              </label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
              />
            </div>
            <button
              onClick={handleSchedule}
              disabled={scheduling}
              className="border-2 border-gold text-gold px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-gold hover:text-white transition-colors disabled:opacity-50"
            >
              {scheduling ? "Scheduling…" : "Schedule"}
            </button>
            {scheduleError && (
              <p className="text-brand text-xs font-medium">{scheduleError}</p>
            )}
          </div>
          <p className="text-xs text-muted mt-2">
            Won&apos;t appear on the public site until this exact time enforced by
            the database, not the app remembering to check.
          </p>
        </div>
      )}
    </div>
  );
}
