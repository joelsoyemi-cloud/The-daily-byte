"use server";
import { createClient } from "@/lib/supabase/server";
import { validateFeedback, type FeedbackInput, type FeedbackResult } from "@/lib/feedback";
export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  if (!input || [input.type, input.title, input.message, input.page_url, input.email].some(value => typeof value !== "string")) return { ok: false, message: "Please complete the feedback form." };
  if (input.website) return { ok: false, message: "Unable to send feedback. Please try again." };
  let values;
  try { values = validateFeedback(input); }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Please check your feedback." }; }
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_feedback", values);
    if (error) return { ok: false, message: error.code === "P0001" ? "Too many requests, or your account is unavailable. Wait a few minutes and try again." : "Feedback could not be sent. Please try again later." };
    return { ok: true, message: "Thank you. Your feedback has been sent to the admin team." };
  } catch { return { ok: false, message: "Feedback could not be sent. Check your connection and try again." }; }
}
