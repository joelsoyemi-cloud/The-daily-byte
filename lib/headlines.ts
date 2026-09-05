export type Headline = {
  title: string;
  link: string;
  source: string;
  pubDate: string;
};

const FEEDS: Record<string, string> = {
  General: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
  Entertainment:
    "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
  Music: "https://news.google.com/rss/search?q=music&hl=en-US&gl=US&ceid=US:en",
  Tech: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
  Business:
    "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
  Lifestyle:
    "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en",
  Sports:
    "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
  Politics:
    "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US&ceid=US:en",
};

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return "";
  return match[1].replace("<![CDATA[", "").replace("]]>", "").trim();
}

export async function fetchHeadlines(category: string): Promise<Headline[]> {
  const url = FEEDS[category] ?? FEEDS.General;

  const res = await fetch(url, {
    next: { revalidate: 900 },
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return items.slice(0, 12).map((block) => {
    const rawTitle = extractTag(block, "title");
    const lastDash = rawTitle.lastIndexOf(" - ");
    const title = lastDash > -1 ? rawTitle.slice(0, lastDash) : rawTitle;
    const source = lastDash > -1 ? rawTitle.slice(lastDash + 3) : "Google News";

    return {
      title,
      source,
      link: extractTag(block, "link"),
      pubDate: extractTag(block, "pubDate"),
    };
  });
}

export const HEADLINE_CATEGORIES = Object.keys(FEEDS);
