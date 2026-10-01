import "server-only";
import { createClient } from "@/lib/supabase/server";
import { STORY_STATUSES } from "@/lib/workspaces";
export const NEWSROOM_STORY_SELECT = "id, title, slug, status, updated_at, profiles(display_name), categories(name)";
export type NewsroomStory = { id: string; title: string; slug: string; status: string; updated_at: string | null; profiles: { display_name: string | null } | null; categories: { name: string } | null };
export async function getStoryCounts(authorId?: string) {
  const supabase = await createClient();
  return Promise.all(STORY_STATUSES.map(async status => {
    let query = supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", status);
    if (authorId) query = query.eq("author_id", authorId);
    const { count, error } = await query;
    return { status, value: error ? null : count };
  }));
}
export function newsroomPage(value?: string) { const page = Number(value); return Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1; }
