export function shareCaption(title: string, url: string, excerpt?: string | null) {
  const clean = (value: string, limit: number) => Array.from(value.replace(/\s+/g, " ").trim()).slice(0, limit).join("");
  return [clean(title, 240), excerpt ? clean(excerpt, 280) : "", "Read on The Daily Byte: " + url].filter(Boolean).join("\n\n");
}
export function shareLinks(title: string, url: string) {
  const text = Array.from(title.replace(/\s+/g, " ").trim()).slice(0, 240).join("");
  return [
    { label: "WhatsApp", href: "https://wa.me/?" + new URLSearchParams({ text: text + "\n" + url }) },
    { label: "X", href: "https://twitter.com/intent/tweet?" + new URLSearchParams({ text, url }) },
    { label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php?" + new URLSearchParams({ u: url }) },
    { label: "LinkedIn", href: "https://www.linkedin.com/sharing/share-offsite/?" + new URLSearchParams({ url }) },
  ];
}
