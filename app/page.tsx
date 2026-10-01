import { createClient } from "@/lib/supabase/server";
import BreakingTicker from "@/components/site/BreakingTicker";
import Hero from "@/components/site/Hero";
import Section from "@/components/site/sections/Section";
import LeadPlusGrid from "@/components/site/sections/LeadPlusGrid";
import ImageGrid from "@/components/site/sections/ImageGrid";
import Rail from "@/components/site/sections/Rail";
import type { StoryCardPost } from "@/components/site/StoryCard";
import { siteUrl, feedAlternate } from "@/lib/site";

export const metadata = { alternates: { canonical: siteUrl("/"), types: feedAlternate } };

export const revalidate = 0;

const SELECT =
  "slug, title, excerpt, cover_image, content_type, published_at, categories(name, slug)";
const visibleFilter = () =>
  `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`;

export default async function HomePage() {
  const supabase = await createClient();

  const { data: categoryRows } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", ["politics", "business", "entertainment", "tech", "sports"]);

  const idFor = (slug: string) =>
    categoryRows?.find((c) => c.slug === slug)?.id;

  const byCategory = (slug: string, limit: number) => {
    const id = idFor(slug);
    let query = supabase.from("posts").select(SELECT).or(visibleFilter());
    query = id
      ? query.eq("category_id", id)
      : query.eq("category_id", "00000000-0000-0000-0000-000000000000");
    return query.order("published_at", { ascending: false, nullsFirst: false }).limit(limit).returns<StoryCardPost[]>();
  };

  const [latest, politics, business, entertainment, tech, sports] =
    await Promise.all([
      supabase
        .from("posts")
        .select(SELECT)
        .or(visibleFilter())
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(8).returns<StoryCardPost[]>(),
      byCategory("politics", 5),
      byCategory("business", 6),
      byCategory("entertainment", 8),
      byCategory("tech", 8),
      byCategory("sports", 6),
    ]);

  if (latest.error) throw new Error("Unable to load the latest stories.");

  return (
    <>
      <h1 className="sr-only">The Daily Byte: news, tech, and culture</h1>
      <BreakingTicker />
      <Hero />

      {(latest.data ?? []).length > 0 && (
        <Section title="Latest News">
          <ImageGrid posts={latest.data ?? []} />
        </Section>
      )}

      {(politics.data ?? []).length > 0 && (
        <Section title="Politics" viewAllHref="/section/politics">
          <LeadPlusGrid posts={politics.data ?? []} />
        </Section>
      )}

      {(business.data ?? []).length > 0 && (
        <Section title="Business" viewAllHref="/section/business">
          <Rail posts={business.data ?? []} />
        </Section>
      )}

      {(entertainment.data ?? []).length > 0 && (
        <Section title="Entertainment" viewAllHref="/section/entertainment">
          <ImageGrid posts={entertainment.data ?? []} />
        </Section>
      )}

      {(tech.data ?? []).length > 0 && (
        <Section title="Technology" viewAllHref="/section/tech">
          <ImageGrid posts={tech.data ?? []} />
        </Section>
      )}

      {(sports.data ?? []).length > 0 && (
        <Section title="Sports" viewAllHref="/section/sports">
          <Rail posts={sports.data ?? []} />
        </Section>
      )}
    </>
  );
}
