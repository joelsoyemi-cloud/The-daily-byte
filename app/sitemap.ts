import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://the-dailybyte-nine.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const visibility = `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`;
  // Supabase caps a response's row count; fetch narrow, bounded batches for discovery.
  async function collect<T>(read: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
    const result: T[] = [];
    for (let start = 0; ; start += 500) {
      const { data, error } = await read(start, start + 499);
      if (error) throw new Error("Unable to generate the public sitemap.");
      result.push(...(data ?? []));
      if (!data || data.length < 500) return result;
    }
  }
  const [posts, categories, profiles] = await Promise.all([
    collect((start, end) => supabase.from("posts").select("slug, updated_at").or(visibility).order("id").range(start, end).returns<{ slug: string; updated_at: string }[]>()),
    collect((start, end) => supabase.from("categories").select("slug").order("slug").range(start, end).returns<{ slug: string }[]>()),
    collect((start, end) => supabase.from("profiles").select("username").not("username", "is", null).order("username").range(start, end).returns<{ username: string }[]>()),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: new URL(`/blog/${encodeURIComponent(post.slug)}`, SITE_URL).toString(),
    lastModified: post.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...["/opinions", "/videos"].map((path) => ({ url: new URL(path, SITE_URL).toString() })),
    ...categories.map((category) => ({ url: new URL(`/section/${encodeURIComponent(category.slug)}`, SITE_URL).toString() })),
    ...profiles.filter((profile) => profile.username).map((profile) => ({ url: new URL(`/author/${encodeURIComponent(profile.username)}`, SITE_URL).toString() })),
    ...postEntries,
  ];
}
