import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateArticleDraft } from "@/lib/ai";
import { searchCoverImage, searchRelatedVideo } from "@/lib/media-search";
import { videoUrlToEmbed } from "@/lib/media";
import { slugify } from "@/lib/posts";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const { title, link, category } = body as {
    title?: string;
    link?: string;
    category?: string;
  };

  if (!title || !link) {
    return NextResponse.json(
      { error: "Missing title or link." },
      { status: 400 },
    );
  }

  try {
    const draft = await generateArticleDraft({
      title,
      sourceUrl: link,
      category: category || "General",
    });

    const finalTitle = draft.title || title;
    const slug = slugify(finalTitle);

    const [coverImage, videoUrl] = await Promise.all([
      searchCoverImage(finalTitle),
      searchRelatedVideo(finalTitle),
    ]);

    let content = `<!-- source: ${link} -->\n\n${draft.content}`;
    if (videoUrl) {
      const embed = videoUrlToEmbed(videoUrl);
      if (embed) content += `\n\n${embed}`;
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title: finalTitle,
        slug,
        excerpt: draft.excerpt || null,
        content,
        category: category || "General",
        cover_image: coverImage,
        published: false,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: post.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Draft generation failed." },
      { status: 500 },
    );
  }
}
