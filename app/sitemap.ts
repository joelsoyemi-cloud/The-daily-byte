export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL as BASE_URL } from "@/lib/site";

const SITE_URL = BASE_URL.toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const visibility = `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`;
  // Supabase caps a response's row count; fetch narrow, bounded batches for discovery.
  async function collect<T>(read: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
    const result: T[] = [];
    for (let start = 0; start < 50000; start += 500) {
      const { data, error } = await read(start, start + 499);
      if (error) throw new Error("Unable to generate the public sitemap.");
      result.push(...(data ?? []));
      if (!data || data.length < 500) return result;
    }
    throw new Error("Sitemap capacity exceeded; split into sitemap files before further growth.");
  }
  const [posts, schools, categories, profiles] = await Promise.all([
    collect((start, end) => supabase.from("posts").select("slug, updated_at").or(visibility).order("id").range(start, end).returns<{ slug: string; updated_at: string }[]>()),
    collect((start, end) => supabase.from("schools").select("slug").eq("status", "active").order("slug").range(start, end).returns<{ slug: string }[]>()),
    collect((start, end) => supabase.from("categories").select("slug").order("slug").range(start, end).returns<{ slug: string }[]>()),
    collect((start, end) => supabase.from("profiles").select("username").not("username", "is", null).order("username").range(start, end).returns<{ username: string }[]>()),
  ]);

  if (posts.length + categories.length + profiles.length + schools.length + 5 > 50000) throw new Error("Sitemap capacity exceeded.");
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: new URL(`/blog/${encodeURIComponent(post.slug)}`, SITE_URL).toString(),
    lastModified: post.updated_at && !Number.isNaN(Date.parse(post.updated_at)) ? post.updated_at : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...["/opinions", "/videos", "/schools", "/write"].map((path) => ({ url: new URL(path, SITE_URL).toString() })),
    ...categories.map((category) => ({ url: new URL(`/section/${encodeURIComponent(category.slug)}`, SITE_URL).toString() })),
    ...profiles.filter((profile) => profile.username).map((profile) => ({ url: new URL(`/author/${encodeURIComponent(profile.username)}`, SITE_URL).toString() })),
    ...schools.map(school => ({ url: new URL("/schools/" + encodeURIComponent(school.slug), SITE_URL).toString() })),
    ...postEntries,
  ];
}
