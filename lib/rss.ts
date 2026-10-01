export function escapeXml(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export type FeedStory = {
  slug: string; title: string; excerpt: string | null;
  published_at: string | null; scheduled_at: string | null;
  profiles: { display_name: string } | null;
};

export function renderRss(stories: FeedStory[], site: string): string {
  const url = (path: string) => escapeXml(new URL(path, site).toString());
  const items = stories.map(story => {
    const published = story.published_at || story.scheduled_at;
    const date = published ? new Date(published) : null;
    return `<item><title>${escapeXml(story.title)}</title><link>${url(`/blog/${encodeURIComponent(story.slug)}`)}</link><guid isPermaLink="true">${url(`/blog/${encodeURIComponent(story.slug)}`)}</guid>${date && !Number.isNaN(date.getTime()) ? `<pubDate>${date.toUTCString()}</pubDate>` : ""}${story.excerpt ? `<description>${escapeXml(story.excerpt)}</description>` : ""}${story.profiles?.display_name ? `<dc:creator>${escapeXml(story.profiles.display_name)}</dc:creator>` : ""}</item>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>The Daily Byte</title><link>${url("/")}</link><description>News, tech, and entertainment — updated daily.</description><language>en</language><atom:link href="${url("/rss.xml")}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
}
