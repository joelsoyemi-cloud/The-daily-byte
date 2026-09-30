"use client";

import { useRef, useState } from "react";
import { slugify } from "@/lib/posts";
import { uploadMedia, videoUrlToEmbed, videoFileEmbed } from "@/lib/media";
import Markdown from "./Markdown";

export type ArticleValues = {
  title: string;
  slug: string;
  category_id: string;
  content_type: string;
  excerpt: string;
  cover_image: string;
  content: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  featured: boolean;
  breaking: boolean;
};

export type ArticleAction = {
  label: string;
  variant: "primary" | "secondary" | "danger";
  onClick: (values: ArticleValues) => Promise<void>;
};

const CONTENT_TYPES = [
  "news",
  "feature",
  "opinion",
  "editorial",
  "interview",
  "press_release",
  "sponsored",
  "review",
  "video",
];

export default function PostForm({
  initialValues,
  categories,
  actions,
  reviewerNote,
  allowEditorialFields = false,
}: {
  initialValues?: Partial<ArticleValues>;
  categories: { id: string; name: string }[];
  actions: ArticleAction[];
  reviewerNote?: string | null;
  allowEditorialFields?: boolean;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initialValues?.slug);
  const [categoryId, setCategoryId] = useState(
    initialValues?.category_id ?? categories[0]?.id ?? "",
  );
  const [contentType, setContentType] = useState(
    initialValues?.content_type ?? "news",
  );
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(
    initialValues?.cover_image ?? "",
  );
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [tagsInput, setTagsInput] = useState(
    (initialValues?.tags ?? []).join(", "),
  );
  const [seoTitle, setSeoTitle] = useState(initialValues?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialValues?.seo_description ?? "",
  );
  const [featured, setFeatured] = useState(initialValues?.featured ?? false);
  const [breaking, setBreaking] = useState(initialValues?.breaking ?? false);
  const [showPreview, setShowPreview] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);
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

  function insertAtCursor(before: string, after: string = "") {
    const el = contentRef.current;
    if (!el) {
      setContent((c) => c + before + after);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const selected = content.slice(start, end);
    const next =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function insertBlock(snippet: string) {
    const el = contentRef.current;
    if (!el) {
      setContent((c) => c + (c ? "\n\n" : "") + snippet + "\n");
      return;
    }
    const start = el.selectionStart ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(el.selectionEnd ?? start);
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
      setCoverImage(await uploadMedia(file));
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
        insertBlock(`![${file.name.replace(/\.[^.]+$/, "")}](${url})`);
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
      insertBlock(videoFileEmbed(url));
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
    insertBlock(embed);
  }

  async function runAction(action: ArticleAction) {
    setRunningAction(action.label);
    setError(null);
    try {
      await action.onClick({
        title,
        slug: slug || slugify(title),
        category_id: categoryId,
        content_type: contentType,
        excerpt,
        cover_image: coverImage,
        content,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seo_title: seoTitle,
        seo_description: seoDescription,
        featured,
        breaking,
      });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setRunningAction(null);
    }
  }

  const canSubmit = !!title && !!content;

  const toolbarBtn = (label: string, onClick: () => void, title?: string) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      title={title}
      className="px-2.5 py-1.5 text-sm font-bold border-r border-line last:border-r-0 hover:bg-surface"
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-900 text-2xl">Article</h1>
        <button
          type="button"
          onClick={() => setShowPreview((s) => !s)}
          className="text-xs font-bold uppercase tracking-wide text-muted hover:text-brand"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {reviewerNote && (
        <div className="border-2 border-gold bg-gold/10 px-4 py-3 mb-6 text-sm">
          <p className="font-bold uppercase text-xs tracking-wide text-gold mb-1">
            Changes requested
          </p>
          <p>{reviewerNote}</p>
        </div>
      )}

      {showPreview ? (
        <div className="border-2 border-line bg-white px-6 py-8">
          <h1 className="font-display font-900 text-3xl leading-tight mb-6">
            {title || "Untitled"}
          </h1>
          <Markdown content={content || "*Nothing to preview yet.*"} />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Headline
            </label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-lg font-semibold"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                Content type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm capitalize"
              >
                {CONTENT_TYPES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c.replace("_", " ")}
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
              Excerpt / deck
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
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Tags{" "}
              <span className="text-muted normal-case font-normal">
                (comma-separated)
              </span>
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. elections, lagos, economy"
              className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
            />
          </div>

          {allowEditorialFields && (
            <div className="flex gap-6 border-2 border-gold bg-gold/5 px-4 py-3">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={breaking}
                  onChange={(e) => setBreaking(e.target.checked)}
                />
                Breaking news
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              Article body
            </label>
            <div className="border-2 border-line border-b-0 bg-surface flex flex-wrap items-center">
              {toolbarBtn("B", () => insertAtCursor("**", "**"), "Bold")}
              {toolbarBtn("i", () => insertAtCursor("*", "*"), "Italic")}
              {toolbarBtn("H2", () => insertBlock("## Heading"), "Heading")}
              {toolbarBtn("❝", () => insertBlock("> Quote"), "Quote")}
              {toolbarBtn(
                "• List",
                () => insertBlock("- Item one\n- Item two"),
                "Bulleted list",
              )}
              {toolbarBtn(
                "Link",
                () => {
                  const url = window.prompt("Link URL:");
                  if (url) insertAtCursor("[", `](${url})`);
                },
                "Link",
              )}
              <div className="ml-auto flex text-xs font-bold uppercase tracking-wide">
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
                  className="px-2.5 py-1.5 text-accent hover:underline disabled:opacity-50"
                >
                  {uploadingImage ? "Uploading…" : "+ Image(s)"}
                </button>
                <button
                  type="button"
                  onClick={handleVideoUrl}
                  className="px-2.5 py-1.5 text-gold hover:underline"
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
                  className="px-2.5 py-1.5 text-gold hover:underline disabled:opacity-50"
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
              placeholder="Use the buttons above — you don't need to know any formatting syntax."
            />
            <p className="text-xs text-muted mt-1">
              The buttons above handle formatting for you. Click Preview anytime
              to see exactly how readers will see it.
            </p>
          </div>

          <details className="border-2 border-line bg-white px-4 py-3">
            <summary className="text-xs font-bold uppercase tracking-wide text-muted cursor-pointer">
              SEO (optional)
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                  SEO title
                </label>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Defaults to the headline if left blank"
                  className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                  SEO description
                </label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={2}
                  placeholder="Defaults to the excerpt if left blank"
                  className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
                />
              </div>
            </div>
          </details>
        </div>
      )}

      {error && <p className="text-brand text-sm font-medium mt-4">{error}</p>}

      <div className="flex items-center gap-3 mt-8 flex-wrap">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => runAction(action)}
            disabled={!!runningAction || !canSubmit}
            className={
              action.variant === "primary"
                ? "bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors disabled:opacity-40"
                : action.variant === "danger"
                  ? "border-2 border-brand text-brand px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand hover:text-white transition-colors disabled:opacity-40"
                  : "border-2 border-line px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:border-ink transition-colors disabled:opacity-40"
            }
          >
            {runningAction === action.label ? "Working…" : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
