import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { estimateReadMinutes, type ArticlePost } from "@/lib/posts";
import Markdown from "@/components/Markdown";
import { Reveal, StaggerReveal, StaggerItem } from "@/components/motion/Reveal";
import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";
import { ArticleReadingProgress } from "@/components/site/ArticleInteractions";
import ShareActions from "@/components/site/ShareActions";
import { DEFAULT_SOCIAL_IMAGE, feedAlternate, siteUrl } from "@/lib/site";

export const revalidate = 0;

const ARTICLE_SELECT = "id, title, slug, excerpt, content, category, cover_image, published_at, updated_at, author_id, category_id, tags, seo_title, seo_description, schools(name, slug, status), categories(name, slug), profiles(id, username, display_name, bio, avatar_url, role)";
const STORY_SELECT = "slug, title, excerpt, cover_image, content_type, published_at, categories(name, slug)";
const visibleFilter = () =>
  `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`;

// Share one request-scoped article lookup between metadata and page rendering.
const getPost = cache(async (slug: string): Promise<ArticlePost | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(ARTICLE_SELECT)
    .eq("slug", slug)
    .or(visibleFilter())
    .returns<ArticlePost[]>()
    .maybeSingle();
  if (error) throw new Error("Unable to load this story.");
  return data ?? null;
});

function articleUrl(slug: string) {
  return siteUrl(`/blog/${encodeURIComponent(slug)}`);
}

function validDate(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function articleDates(post: ArticlePost) {
  const published = validDate(post.published_at);
  const updated = validDate(post.updated_at);
  // Row updates include workflow events: suppress insignificant timestamp changes.
  const modified = published && updated && Date.parse(updated) - Date.parse(published) >= 5 * 60 * 1000
    ? updated : undefined;
  return { published, modified };
}

function displayDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const url = articleUrl(post.slug);
  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || undefined;
  const { published, modified } = articleDates(post);
  const author = post.profiles?.display_name;
  return {
    title,
    description,
    alternates: { canonical: url, types: feedAlternate },
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title, description, url, siteName: "The Daily Byte", type: "article",
      publishedTime: published,
      modifiedTime: modified,
      authors: author ? [author] : undefined,
      section: post.categories?.name || post.category || undefined,
      images: post.cover_image ? [post.cover_image] : [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: post.cover_image ? [post.cover_image] : [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

async function getRecommendations(post: ArticlePost) {
  const supabase = await createClient();
  const visibility = visibleFilter();
  const query = () => supabase.from("posts").select(STORY_SELECT)
    .neq("id", post.id).or(visibility)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false }).order("id");
  const [relatedResult, authorResult] = await Promise.all([
    post.category_id
      ? query().eq("category_id", post.category_id).limit(3).returns<StoryCardPost[]>()
      : Promise.resolve({ data: null }),
    post.author_id
      ? query().eq("author_id", post.author_id).limit(6).returns<StoryCardPost[]>()
      : Promise.resolve({ data: null }),
  ]);
  const related = relatedResult.data ?? [];
  const relatedSlugs = new Set(related.map((story) => story.slug));
  const fromAuthor = (authorResult.data ?? []).filter((story) => !relatedSlugs.has(story.slug)).slice(0, 3);
  return { related, fromAuthor };
}

function StorySection({ id, title, eyebrow, posts }: { id: string; title: string; eyebrow: string; posts: StoryCardPost[] }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby={id} className="mt-14 border-t border-line pt-10 sm:mt-20 sm:pt-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        <h2 id={id} className="mt-3 font-display text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{title}</h2>
      </Reveal>
      <StaggerReveal className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((story) => (
          <StaggerItem key={story.slug} className="min-w-0 [&_h3]:font-bold motion-reduce:[&_img]:transform-none motion-reduce:[&_img]:transition-none motion-reduce:[&_h3]:transform-none motion-reduce:[&_h3]:transition-none motion-reduce:[&_svg]:transform-none motion-reduce:[&_svg]:transition-none">
            <StoryCard post={story} />
          </StaggerItem>
        ))}
      </StaggerReveal>
    </section>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const { related, fromAuthor } = await getRecommendations(post);
  const url = articleUrl(post.slug);
  const category = post.categories?.name || post.category;
  const author = post.profiles;
  const { published, modified } = articleDates(post);
  const tags = [...new Set((post.tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  const initials = author?.display_name.trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("") || "DB";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: published,
    dateModified: modified,
    articleSection: category || undefined,
    author: author?.display_name ? { "@type": "Person", name: author.display_name, url: author.username ? siteUrl(`/author/${encodeURIComponent(author.username)}`) : undefined } : undefined,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: { "@type": "Organization", name: "The Daily Byte", logo: { "@type": "ImageObject", url: new URL("/brand/logo-mark.svg", url).toString(), width: 512, height: 512 } },
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <ArticleReadingProgress key={post.id} targetId="article-reading-area" />
      <article aria-labelledby="article-title" className="min-w-0">
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          // Contributor text must never be able to close the script element.
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
            ...(post.categories ? [{ "@type": "ListItem", position: 2, name: post.categories.name, item: siteUrl(`/section/${encodeURIComponent(post.categories.slug)}`) }] : []),
            { "@type": "ListItem", position: post.categories ? 3 : 2, name: post.title, item: url },
          ],
        }).replace(/</g, "\\u003c") }} />

        <Reveal>
          {post.schools?.status === "active" && <Link href={"/schools/" + encodeURIComponent(post.schools.slug)} className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline [overflow-wrap:anywhere]">{post.schools.name}</Link>}
          <nav aria-label="Breadcrumb" className="text-xs text-muted sm:text-sm">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li><Link href="/" className="inline-flex min-h-11 items-center font-medium hover:text-brand">Home</Link></li>
              {category && <li className="flex min-w-0 items-center gap-2"><span aria-hidden="true">/</span><span className="break-words [overflow-wrap:anywhere]">{category}</span></li>}
              <li className="flex items-center gap-2"><span aria-hidden="true">/</span><span aria-current="page">Article</span></li>
            </ol>
          </nav>
        </Reveal>

        <header className="mx-auto max-w-4xl pb-8 pt-6 sm:pb-10 sm:pt-10">
          <StaggerReveal staggerDelay={0.07}>
            <StaggerItem>
              {category && <p className="mb-5 inline-flex max-w-full rounded-full bg-brand/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-brand [overflow-wrap:anywhere]">{category}</p>}
              <h1 id="article-title" className="font-display text-3xl font-black leading-[1.12] tracking-tight [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">{post.title}</h1>
              {post.excerpt && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted [overflow-wrap:anywhere] sm:mt-6 sm:text-xl lg:text-2xl">{post.excerpt}</p>}
            </StaggerItem>
            <StaggerItem>
              <div className="mt-7 flex flex-col gap-4 border-t border-line pt-6 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  {author?.display_name && <p className="text-sm text-muted">By {author.username ? <Link href={`/author/${encodeURIComponent(author.username)}`} className="font-semibold text-ink underline-offset-4 hover:text-brand hover:underline [overflow-wrap:anywhere]">{author.display_name}</Link> : <span className="font-semibold text-ink [overflow-wrap:anywhere]">{author.display_name}</span>}</p>}
                  {(published || modified) && <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs leading-relaxed text-muted sm:text-sm">
                    {published && <span>Published <time dateTime={published}>{displayDate(published)}</time></span>}
                    {modified && <span>Updated <time dateTime={modified}>{displayDate(modified)}</time></span>}
                  </div>}
                </div>
                <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-surface px-3 py-2 text-xs font-medium text-muted">
                  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
                  {estimateReadMinutes(post.content)} min read
                </span>
              </div>
              <div className="mt-6"><ShareActions key={post.id} title={post.title} url={url} excerpt={post.excerpt} /></div>
            </StaggerItem>
          </StaggerReveal>
        </header>

        {post.cover_image && <Reveal className="mb-10 sm:mb-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface shadow-soft-lg sm:aspect-[16/9] sm:rounded-3xl">
            <Image src={post.cover_image} alt="" fill priority sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 48px), (max-width: 1151px) calc(100vw - 64px), 1088px" className="object-cover" />
          </div>
        </Reveal>}

        <div className="mx-auto max-w-prose">
          <div id="article-reading-area" className="min-w-0 [overflow-wrap:anywhere] [&_.article-body_h1]:font-display [&_.article-body_h1]:text-2xl [&_.article-body_h1]:font-bold [&_.article-body_h1]:my-8 [&_.article-body_table]:block [&_.article-body_table]:max-w-full [&_.article-body_table]:overflow-x-auto [&_.article-body_th]:p-3 [&_.article-body_td]:p-3 [&_.article-body_th]:text-left [&_.article-body_td]:border-b [&_.article-body_iframe]:max-w-full [&_.article-body_pre]:max-w-full">
            <Markdown content={post.content} />
          </div>

          {tags.length > 0 && <section aria-label="Article tags" className="mt-10 border-t border-line pt-6">
            <ul className="flex flex-wrap gap-2">{tags.map((tag) => <li key={tag} className="max-w-full rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium [overflow-wrap:anywhere]">{tag}</li>)}</ul>
          </section>}

          {author && <Reveal className="mt-10 sm:mt-12">
            <section aria-labelledby="article-author" className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand/10 font-display text-xl font-bold text-brand">
                  {author.avatar_url ? <Image src={author.avatar_url} alt="" fill sizes="64px" className="object-cover" /> : <span aria-hidden="true">{initials}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">About the author</p>
                  <h2 id="article-author" className="mt-2 font-display text-xl font-bold [overflow-wrap:anywhere]">{author.username ? <Link href={`/author/${encodeURIComponent(author.username)}`} className="inline-block rounded-lg underline-offset-4 hover:text-brand hover:underline motion-safe:transition-colors">{author.display_name || author.username}</Link> : author.display_name || "Author"}</h2>
                  {author.username && <p className="mt-1 text-sm text-muted [overflow-wrap:anywhere]">@{author.username}</p>}
                  {author.bio && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted [overflow-wrap:anywhere]">{author.bio}</p>}
                </div>
              </div>
            </section>
          </Reveal>}
        </div>
      </article>

      <StorySection id="related-stories" title="Related stories" eyebrow="Keep exploring" posts={related} />
      <StorySection id="author-stories" title={author?.display_name ? `More from ${author.display_name}` : "More from this author"} eyebrow="Another perspective" posts={fromAuthor} />

      <Reveal className="mt-14 sm:mt-20">
        <aside aria-labelledby="stay-in-the-loop" className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-10 lg:p-12">
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-brand" />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">The Daily Byte</p>
          <h2 id="stay-in-the-loop" className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">Stay in the loop.</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">Fresh perspectives on news, tech, and culture. Make The Daily Byte part of your daily reading.</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-brand motion-safe:transition-colors">Explore the latest <span aria-hidden="true" className="ml-2">&rarr;</span></Link>
        </aside>
      </Reveal>
    </div>
  );
}
