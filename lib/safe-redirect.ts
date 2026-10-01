/** Only same-origin paths may reach the router after authentication. */
export function safeRedirectPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return fallback;
    const url = new URL(value, "https://local.invalid");
    return url.origin === "https://local.invalid" ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
