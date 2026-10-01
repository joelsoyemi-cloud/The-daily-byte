import { createPublicClient } from "@/lib/supabase/public";
import { publicVisibility } from "@/lib/public-listings";
import { renderRss, type FeedStory } from "@/lib/rss";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await createPublicClient().from("posts")
    .select("slug, title, excerpt, published_at, scheduled_at, profiles(display_name)")
    .or(publicVisibility()).order("published_at", { ascending: false, nullsFirst: false })
    .order("id").limit(50).returns<FeedStory[]>();
  if (error) return new Response("The feed is temporarily unavailable.", { status: 503, headers: { "Cache-Control": "no-store" } });
  return new Response(renderRss(data ?? [], SITE_URL.toString()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
