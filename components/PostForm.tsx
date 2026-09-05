"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify, CATEGORIES, type Post } from "@/lib/posts";
import { uploadMedia, videoUrlToEmbed, videoFileEmbed } from "@/lib/media";
import Markdown from "./Markdown";

export default function PostForm({
  post,
  prefill,
}: {
  post?: Post;
  prefill?: {
    title?: string;
    category?: string;
    slug?: string;
    sourceUrl?: string;
  };
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? prefill?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? prefill?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEditing || !!prefill);
  const [category, setCategory] = useState(
    post?.category ?? prefill?.category ?? CATEGORIES[0],
  );
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [content, setContent] = useState(
    post?.content ??
      (prefill?.sourceUrl ? `<!-- source: ${prefill.sourceUrl} -->\n\n` : ""),
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function insertIntoContent(snippet: string) {
    const el = contentRef.current;
    if (!el) {
      setContent((c) => c + (c ? "\n\n" : "") + snippet + "\n");
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const needsLeadingBreak = before && !before.endsWith("\n\n");
    const insert = (needsLeadingBreak ? "\n\n" : "") + snippet + "\n\n";
    const next = before + insert + after;
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = (before + insert).length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    try {
      const url = await uploadMedia(file);
      setCoverImage(url);
    } catch (err: any) {
      setError(err.message ?? "Cover image upload failed.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImage(true);
    setError(null);
    try {
      for (const file of files) {
        const url = await uploadMedia(file);
        insertIntoContent(`![${file.name.replace(/\.[^.]+$/, "")}](${url})`);
      }
    } catch (err: any) {
      setError(err.message ?? "Image upload failed.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleVideoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setError(null);
    try {
      const url = await uploadMedia(file);
      insertIntoContent(videoFileEmbed(url));
    } catch (err: any) {
      setError(err.message ?? "Video upload failed.");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  }

  function handleVideoUrl() {
    const url = window.prompt("Paste a YouTube or Vimeo link:");
    if (!url) return;
    const embed = videoUrlToEmbed(url);
    if (!embed) {
      setError("That link doesn't look like a YouTube or Vimeo URL.");
      return;
    }
    insertIntoContent(embed);
  }

  async function save(publish: boolean) {
    setSaving(true);
    setError(null);

    const payload = {
      title,
      slug: slug || slugify(title),
      category,
      excerpt: excerpt || null,
      cover_image: coverImage || null,
      content,
      published: publish,
      published_at: publish
        ? (post?.published_at ?? new Date().toISOString())
        : (post?.published_at ?? null),
    };

    const { error } = isEditing
      ? await supabase.from("posts").update(payload).eq("id", post!.id)
      : await supabase.from("posts").insert(payload);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-900 text-2xl">
          {isEditing ? "Edit post" : "New post"}
        </h1>
        <button
          type="button"
          onClick={() => setShowPreview((s) => !s)}
          className="text-xs font-bold uppercase tracking-wide text-muted hover:text-brand"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {showPreview ? (
        <div className="border-2 border-line bg-white px-6 py-8">
          <span className="inline-block bg-brand text-white text-[11px] font-bold uppercase tracking-wide px-2 py-1 mb-3">
            {category}
          </span>
          <h1 className="font-display font-900 text-3xl leading-tight mb-6">
            {title || "Untitled"}
          </h1>
          <Markdown content={content || "*Nothing to preview yet.*"} />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-lg font-semibold"
              placeholder="Big Brother finale sparks online reactions"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                Slug
              </label>
              <div className="flex items-center border-2 border-line focus-within:border-ink bg-white overflow-hidden">
                <span className="pl-3 text-muted text-sm">/blog/</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  className="flex-1 px-1 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Excerpt (shown on the front page)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Cover image
            </label>
            <div className="flex gap-2">
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
                placeholder="Paste a URL, or upload a file →"
              />
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="border-2 border-line px-3 py-2 text-xs font-bold uppercase tracking-wide hover:border-ink disabled:opacity-50 shrink-0"
              >
                {uploadingCover ? "Uploading…" : "Upload"}
              </button>
            </div>
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt=""
                className="mt-2 h-24 w-auto rounded border border-line object-cover"
              />
            )}
            <p className="text-xs text-muted mt-1">
              Images are automatically compressed before upload to keep the site
              fast.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wide text-muted">
                Content (Markdown)
              </label>
              <div className="flex gap-3 text-xs font-bold uppercase tracking-wide">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-accent hover:underline disabled:opacity-50"
                >
                  {uploadingImage ? "Uploading…" : "+ Image(s)"}
                </button>

                <button
                  type="button"
                  onClick={handleVideoUrl}
                  className="text-gold hover:underline"
                >
                  + Video URL
                </button>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoFileUpload}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="text-gold hover:underline disabled:opacity-50"
                >
                  {uploadingVideo ? "Uploading…" : "+ Video file"}
                </button>
              </div>
            </div>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full border-2 border-line focus:border-ink px-3 py-3 bg-white text-sm font-mono leading-relaxed"
              placeholder={
                "## Intro\n\nWrite in Markdown. Use the buttons above to drop in images or video anywhere in the text."
              }
            />
            <p className="text-xs text-muted mt-1">
              Uploaded images/videos are inserted at your cursor — you can cut
              and paste them anywhere in the text afterward. Add as many as you
              like.
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-brand text-sm font-medium mt-4">{error}</p>}

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={() => save(true)}
          disabled={saving || !title || !content}
          className="bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors disabled:opacity-40"
        >
          {saving ? "Saving…" : post?.published ? "Save" : "Publish"}
        </button>
        <button
          onClick={() => save(false)}
          disabled={saving || !title || !content}
          className="border-2 border-line px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:border-ink transition-colors disabled:opacity-40"
        >
          Save as draft
        </button>
      </div>
    </div>
  );
}
