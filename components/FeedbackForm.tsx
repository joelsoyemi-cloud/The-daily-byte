"use client";
import { useState } from "react";
import Link from "next/link";
import { submitFeedback } from "@/app/feedback/actions";
export default function FeedbackForm({ signedIn, initialPage = "" }: { signedIn: boolean; initialPage?: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "");
    setPending(true); setResult(null);
    try { setResult(await submitFeedback({ type: field("type"), title: field("title"), message: field("message"), page_url: field("page_url"), email: signedIn ? "" : field("email"), website: field("website") })); }
    catch { setResult({ ok: false, message: "Feedback could not be sent. Check your connection and try again." }); }
    finally { setPending(false); }
  }
  const input = "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-line bg-white px-3 py-3 text-base";
  if (result?.ok) return <div className="rounded-2xl border border-line bg-surface p-6"><p role="status">{result.message}</p><p className="mt-3 text-sm text-muted">We review reports during testing. A personal reply is not guaranteed.</p><button type="button" onClick={() => setResult(null)} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand">Send another report</button><Link href="/" className="ml-4 inline-flex min-h-11 items-center underline">Back to stories</Link></div>;
  return <form onSubmit={submit} aria-busy={pending} className="min-w-0 space-y-5">
    <div><label htmlFor="feedback-type" className="font-semibold">Type</label><select id="feedback-type" name="type" className={input}><option value="bug">Bug</option><option value="suggestion">Suggestion</option><option value="content_issue">Content issue</option><option value="other">Other</option></select></div>
    <div><label htmlFor="feedback-title" className="font-semibold">Short title</label><input id="feedback-title" name="title" required maxLength={120} className={input} /></div>
    <div><label htmlFor="feedback-message" className="font-semibold">Message</label><textarea id="feedback-message" name="message" required minLength={10} maxLength={4000} rows={6} aria-describedby="feedback-privacy" className={input} /><p id="feedback-privacy" className="mt-2 text-xs leading-relaxed text-muted">Tell us what happened and what you expected. Do not include passwords, confirmation links, or sensitive personal information. Reports are visible only to admins.</p></div>
    <div><label htmlFor="feedback-url" className="font-semibold">Page URL <span className="font-normal text-muted">(optional)</span></label><input id="feedback-url" name="page_url" type="url" maxLength={2048} defaultValue={initialPage} placeholder="https://…" className={input} /><p className="mt-2 text-xs text-muted">Query parameters and fragments are removed for privacy.</p></div>
    {!signedIn && <div><label htmlFor="feedback-email" className="font-semibold">Email <span className="font-normal text-muted">(optional)</span></label><input id="feedback-email" name="email" type="email" autoComplete="email" maxLength={254} className={input} /><p className="mt-2 text-xs text-muted">Include it only if you are happy for an admin to contact you about this report.</p></div>}
    <div hidden aria-hidden="true"><label htmlFor="feedback-website">Leave this empty</label><input id="feedback-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    {result && <p role="alert" className="text-sm text-brand">{result.message}</p>}
    <button disabled={pending} type="submit" className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 font-semibold text-white hover:bg-brand disabled:opacity-50">{pending ? "Sending…" : "Send feedback"}</button>
  </form>;
}
