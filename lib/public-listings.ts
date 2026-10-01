import { createClient } from "@/lib/supabase/server";
import type { StoryCardPost } from "@/components/site/StoryCard";

export const PAGE_SIZE = 12;
export type ListingSearchParams = Promise<{ page?: string | string[] }>;
export const publicVisibility = () =>
  `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`;

export function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  // Bound offsets as well as row counts; malformed or excessive input resets safely.
  return Number.isSafeInteger(page) && page <= 10000 ? page : 1;
}

export { siteUrl as publicUrl } from "./site";

export async function getPublicStories({ page, categoryId, authorId, contentType }: {
  page: number;
  categoryId?: string;
  authorId?: string;
  contentType?: "video";
}) {
  const supabase = await createClient();
  let query = supabase.from("posts")
    .select("slug, title, excerpt, cover_image, content_type, published_at, categories(name, slug)", { count: "exact" })
    .or(publicVisibility());
  if (categoryId) query = query.eq("category_id", categoryId);
  if (authorId) query = query.eq("author_id", authorId);
  if (contentType) query = query.eq("content_type", contentType);
  const { data, count, error } = await query
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .returns<StoryCardPost[]>();
  return { posts: data ?? [], count: count ?? 0, failed: Boolean(error && error.code !== "PGRST103") };
}
