import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateArticleDraft } from "@/lib/ai";
import { searchCoverImage, searchRelatedVideo } from "@/lib/media-search";
import { videoUrlToEmbed } from "@/lib/media";
import { slugify } from "@/lib/posts";
import { safeHeadlineSource } from "@/lib/source-url";
import { HEADLINE_CATEGORIES } from "@/lib/headlines";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();
  if (profile?.status !== "active" || !["contributor", "author", "editor", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Expected a JSON request." }, { status: 415 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !("title" in body) || !("link" in body) ||
      typeof body.title !== "string" || !body.title.trim() || body.title.length > 500 ||
      typeof body.link !== "string" || body.link.length > 4096 || !safeHeadlineSource(body.link)) {
    return NextResponse.json({ error: "Choose a valid source from the headlines page." }, { status: 400 });
  }
  const title = body.title.trim();
  const link = safeHeadlineSource(body.link)!;
  const category = "category" in body && typeof body.category === "string" && HEADLINE_CATEGORIES.includes(body.category) ? body.category : "General";
  try {
    const draft = await generateArticleDraft({ title, sourceUrl: link, category });
    const finalTitle = draft.title || title;
    const { data: categoryRow } = await supabase.from("categories").select("id").eq("slug", slugify(category)).single();
    const [coverImage, videoUrl] = await Promise.all([searchCoverImage(finalTitle), searchRelatedVideo(finalTitle)]);
    let content = "<!-- source: " + link + " -->\n\n" + draft.content;
    if (videoUrl) {
      const embed = videoUrlToEmbed(videoUrl);
      if (embed) content += "\n\n" + embed;
    }
    const { data: post, error } = await supabase.from("posts").insert({
      title: finalTitle, slug: slugify(finalTitle), excerpt: draft.excerpt || null,
      content, author_id: user.id, category_id: categoryRow?.id ?? null,
      cover_image: coverImage, status: "draft",
    }).select("id").single();
    if (error) return NextResponse.json({ error: "Unable to save the draft. Please try again." }, { status: 500 });
    return NextResponse.json({ id: post.id });
  } catch {
    return NextResponse.json({ error: "Draft generation is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
