"use server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FEEDBACK_STATUSES } from "@/lib/feedback";
import { revalidatePath } from "next/cache";
export async function updateFeedbackStatus(id: string, status: string) {
  await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !FEEDBACK_STATUSES.some(value => value === status)) return { ok: false, message: "Choose a valid feedback status." };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("feedback_submissions").update({ status }).eq("id", id).select("id").maybeSingle();
    if (error || !data) return { ok: false, message: "This report could not be updated. Refresh and try again." };
    revalidatePath("/admin/feedback"); revalidatePath("/admin");
    return { ok: true, message: "Status updated." };
  } catch { return { ok: false, message: "Unable to update the report right now." }; }
}
