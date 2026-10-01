/** Draft sources originate in the existing Google News headline feed. */
export function safeHeadlineSource(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "news.google.com" || url.port || url.username || url.password) return null;
    if (!/^\/(?:rss\/)?articles\/[A-Za-z0-9_-]+$/.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
