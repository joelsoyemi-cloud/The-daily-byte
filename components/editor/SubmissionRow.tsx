"use client";
import { StatusBadge } from "@/components/dashboard/WorkspaceUI";


import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/posts";

export type Submission = {
  id: string;
  title: string;
  slug: string;
  status: string;
  content_type: string;
  updated_at: string;
  profiles: { display_name: string } | null;
  schools: { name: string } | null;
  categories: { name: string } | null;
  submitted_at: string | null;
  last_action: string | null;
};

export default function SubmissionRow({ post }: { post: Submission }) {
  const router = useRouter();
  const supabase = createClient();
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function logAndTransition(
    action: string,
    newStatus: string,
    feedback?: string,
  ) {
    setWorking(action);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("posts")
      .update({ status: newStatus })
      .eq("id", post.id);

    if (updateError) {
      setError(updateError.message);
      setWorking(null);
      return;
    }

    await supabase.from("review_history").insert({
      post_id: post.id,
      reviewer_id: user.id,
      action,
      feedback: feedback || null,
    });

    router.refresh();
    setWorking(null);
  }

  function handleApprove() {
    logAndTransition("approved", "approved");
  }

  function handlePublish() {
    logAndTransition("published", "published");
  }

  function handleRequestChanges() {
    const feedback = window.prompt(
      "What needs to change before this can be approved?",
    );
    if (!feedback) return;
    logAndTransition("changes_requested", "changes_requested", feedback);
  }

  function handleReject() {
    const feedback = window.prompt(
      "Reason for rejecting (shown to the author):",
    );
    if (!feedback) return;
    logAndTransition("rejected", "rejected", feedback);
  }

  return (
    <li className="px-5 py-6 border-b border-line last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <StatusBadge status={post.status} /><h3 className="font-display font-bold text-lg leading-snug mt-3 mb-2 [overflow-wrap:anywhere]">{post.title}</h3>
          <p className="text-xs text-muted mt-1">
            by {post.profiles?.display_name ?? "Unknown"} &middot;{" "}
            {post.schools && <span>{post.schools.name} &middot; </span>}{post.categories?.name ?? "Uncategorized"} &middot;{" "}
            <span className="capitalize">
              {post.content_type.replace("_", " ")}
            </span>
          </p>
          <p className="text-xs text-muted mt-0.5">
            Submitted {post.submitted_at ? formatDate(post.submitted_at) : "—"}{" "}
            &middot; Updated {formatDate(post.updated_at)}
            {post.last_action && (
              <>
                {" "}
                &middot; Last action:{" "}
                <span className="capitalize">
                  {post.last_action.replace("_", " ")}
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href={`/editor/articles/${post.id}/edit`}
          className="nr-row-action"
        >
          Read / Edit / Schedule
        </Link>
      </div>

      {error && <p role="alert" className="text-brand text-xs font-medium mb-2">{error}</p>}

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={handleApprove}
          disabled={!!working}
          className="border border-line px-3 text-[#805c10] hover:bg-surface disabled:opacity-50"
        >
          {working === "approved" ? "Working…" : "Approve"}
        </button>
        <button
          onClick={handlePublish}
          disabled={!!working}
          className="border border-line px-3 text-accent hover:bg-surface disabled:opacity-50"
        >
          {working === "published" ? "Publishing…" : "Publish Now"}
        </button>
        <button
          onClick={handleRequestChanges}
          disabled={!!working}
          className="border border-line px-3 text-[#805c10] hover:bg-surface disabled:opacity-50"
        >
          Request Changes
        </button>
        <button
          onClick={handleReject}
          disabled={!!working}
          className="border border-line px-3 text-brand hover:bg-surface disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </li>
  );
}
