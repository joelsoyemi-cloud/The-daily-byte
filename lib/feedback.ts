export const FEEDBACK_TYPES = ["bug", "suggestion", "content_issue", "other"] as const;
export const FEEDBACK_STATUSES = ["new", "reviewing", "resolved", "ignored"] as const;
export type FeedbackInput = { type: string; title: string; message: string; page_url: string; email: string; website?: string };
export type FeedbackResult = { ok: boolean; message: string };
export function validateFeedback(input: FeedbackInput) {
  const title = input.title.trim(), message = input.message.trim(), email = input.email.trim();
  if (!FEEDBACK_TYPES.some(type => type === input.type)) throw new Error("Choose a feedback type.");
  if (!title || title.length > 120) throw new Error("Add a short title of up to 120 characters.");
  if (message.length < 10 || message.length > 4000) throw new Error("Use between 10 and 4,000 characters to describe the problem or idea.");
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error("Enter a valid email address or leave it empty.");
  let page_url: string | null = null;
  if (input.page_url.trim()) {
    try {
      if (input.page_url.length > 2048) throw new Error();
      const url = new URL(input.page_url.trim());
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
      url.search = ""; url.hash = "";
      page_url = url.toString();
    } catch { throw new Error("Enter a full http or https page address, or leave it empty."); }
  }
  return { p_type: input.type, p_title: title, p_message: message, p_page_url: page_url, p_email: email || null };
}
