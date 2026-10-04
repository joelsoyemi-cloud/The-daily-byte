import type { Metadata } from "next";

export const SITE_NAME = "The Daily Byte";
export const SITE_DESCRIPTION = "News, tech, and entertainment — updated daily.";
export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://readthedailybyte.com");
export const siteUrl = (path: string) => new URL(path, SITE_URL).toString();
export const DEFAULT_SOCIAL_IMAGE = {
  url: siteUrl("/brand/the-daily-byte-og.png"), width: 1731, height: 909,
  alt: "The Daily Byte — news, tech, and culture",
};
export const feedAlternate = { "application/rss+xml": siteUrl("/rss.xml") };

export function publicPageMetadata({ title, description, path, page = 1, profile = false }: {
  title: string; description?: string; path: string; page?: number; profile?: boolean;
}): Metadata {
  const pageTitle = page > 1 ? `${title} — Page ${page}` : title;
  const url = siteUrl(page > 1 ? `${path}?page=${page}` : path);
  return {
    title: pageTitle, description,
    alternates: { canonical: url, types: feedAlternate },
    openGraph: { title: pageTitle, description, url, type: profile ? "profile" : "website", siteName: SITE_NAME, images: [DEFAULT_SOCIAL_IMAGE] },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: [DEFAULT_SOCIAL_IMAGE] },
  };
}
