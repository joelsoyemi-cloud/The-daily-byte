"use client";
import { useEffect, useRef, useState } from "react";
import { shareCaption, shareLinks } from "@/lib/sharing";
export default function ShareActions({ title, url, excerpt, compact = false }: { title: string; url: string; excerpt?: string | null; compact?: boolean }) {
  const [native, setNative] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState<{ label: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; setNative(typeof navigator.share === "function"); return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); }; }, []);
  function announce(text: string) {
    if (!mounted.current) return;
    if (timer.current) clearTimeout(timer.current);
    setMessage(text); timer.current = setTimeout(() => setMessage(""), 4000);
  }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); if (!mounted.current) return; setManual(null); announce(label + " copied."); }
    catch { if (!mounted.current) return; setManual({ text, label }); announce("Select and copy the " + label.toLowerCase() + " below."); }
  }
  async function share() {
    try { await navigator.share({ title, url }); }
    catch (error: unknown) { if (error instanceof Error && error.name === "AbortError") return; await copy(url, "Link"); }
  }
  const button = "inline-flex min-h-11 max-w-full items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  return <div role="group" aria-label={"Share story: " + title} className="min-w-0 space-y-3">
    <div className="flex flex-wrap gap-2">{shareLinks(title, url).filter(link => !compact || ["WhatsApp", "X"].includes(link.label)).map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={button} aria-label={"Share on " + link.label + " (opens a new tab)"}>{link.label}</a>)}
      <button type="button" onClick={() => copy(url, "Link")} className={button}>Copy link</button>
      <button type="button" onClick={() => copy(shareCaption(title, url, excerpt), "Caption")} className={button}>Copy caption</button>
      {native && <button type="button" onClick={share} className={button}>More sharing options</button>}
    </div>
    <p role="status" aria-live="polite" className="text-xs text-muted">{message}</p>
    {manual && <label className="block text-sm">{manual.label}<textarea readOnly rows={manual.label === "Caption" ? 5 : 2} value={manual.text} onFocus={e => e.currentTarget.select()} className="mt-2 w-full min-w-0 rounded-xl border border-line bg-surface p-3 text-sm" /></label>}
  </div>;
}
