"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import BrandLogo from "@/components/brand/BrandLogo";
import Link from "next/link";
import { motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { softSpring } from "@/components/motion/Reveal";
import { createClient } from "@/lib/supabase/client";

type SearchResult = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  categories: { name: string } | null;
};

type SearchState = {
  query: string;
  status: "loading" | "success" | "error";
  results: SearchResult[];
};

const RESULT_LIMIT = 8;
const SELECT = "slug, title, excerpt, cover_image, published_at, categories(name)";

function publicationTime(value: string | null) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? 0 : time;
}

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [supabase] = useState(createClient);
  const [input, setInput] = useState("");
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState<SearchState>({ query: "", status: "success", results: [] });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const inputId = useId();
  const statusId = useId();
  const query = input.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  const canSearch = query.length >= 2;
  // Hide previous results immediately, including the render before effect cleanup.
  const current = search.query === query ? search : null;
  const loading = canSearch && (!current || current.status === "loading");
  const results = canSearch && current?.status === "success" ? current.results : [];
  const failed = canSearch && current?.status === "error";

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!canSearch) return;
    const controller = new AbortController();
    let active = true;
    setSearch({ query, status: "loading", results: [] });

    const timer = setTimeout(async () => {
      // Scalar ilike filters keep commas/quotes out of PostgREST's OR grammar.
      // Escape SQL LIKE wildcards and backslashes so % and _ are searched literally.
      const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
      const visibility = `status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${new Date().toISOString()})`;
      const match = (field: "title" | "excerpt") => supabase
        .from("posts")
        .select(SELECT)
        .or(visibility)
        .ilike(field, pattern)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("slug")
        .limit(RESULT_LIMIT)
        .abortSignal(controller.signal)
        .returns<SearchResult[]>();

      try {
        const [titles, excerpts] = await Promise.all([match("title"), match("excerpt")]);
        if (!active) return;
        if (titles.error || excerpts.error) {
          setSearch({ query, status: "error", results: [] });
          return;
        }
        const unique = new Map<string, SearchResult>();
        for (const result of [...(titles.data ?? []), ...(excerpts.data ?? [])]) {
          unique.set(result.slug, result);
        }
        const matches = [...unique.values()]
          .sort((a, b) => publicationTime(b.published_at) - publicationTime(a.published_at) || a.slug.localeCompare(b.slug))
          .slice(0, RESULT_LIMIT);
        setSearch({ query, status: "success", results: matches });
      } catch {
        if (active) setSearch({ query, status: "error", results: [] });
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, query, retry, supabase]);

  const status = !canSearch
    ? "Enter at least 2 characters to search."
    : loading
      ? "Searching stories…"
      : failed
        ? "Search is unavailable right now. Please try again."
        : results.length
          ? `${results.length === RESULT_LIMIT ? "Top " : ""}${results.length} ${results.length === 1 ? "story" : "stories"} found.`
          : "No stories found. Try a different word or phrase.";

  return (
    <motion.dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        // Search inputs can consume Escape to clear their value before dialog cancel.
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]',
        )].filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-3 text-ink backdrop:bg-transparent open:flex open:items-start open:justify-center sm:p-6 sm:pt-[10vh]"
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
        onClick={onClose}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
        transition={{ duration: reducedMotion ? 0 : 0.18 }}
      />
      <motion.div
        className="relative mt-3 flex max-h-[calc(100dvh-3rem)] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-soft-lg sm:mt-0 sm:max-h-[80dvh]"
        variants={{
          hidden: { opacity: 0, y: reducedMotion ? 0 : 16, scale: reducedMotion ? 1 : 0.98 },
          visible: { opacity: 1, y: 0, scale: 1 },
        }}
        transition={reducedMotion ? { duration: 0 } : softSpring}
      >
        <div className="shrink-0 border-b border-line p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <BrandLogo className="text-xl" />
              <h2 id={titleId} className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Find your next read.</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface hover:bg-brand/10 hover:text-brand motion-safe:transition-colors">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          <label htmlFor={inputId} className="sr-only">Search article titles and excerpts</label>
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 sm:px-4">
            <svg aria-hidden="true" className="shrink-0 text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" strokeLinecap="round" /></svg>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search news, ideas, culture…"
              maxLength={120}
              autoComplete="off"
              enterKeyHint="search"
              aria-describedby={statusId}
              className="min-h-14 w-full min-w-0 bg-transparent py-3 text-base text-ink outline-none placeholder:text-muted focus-visible:outline-none"
            />
            {input && <button type="button" aria-label="Clear search" onClick={() => { setInput(""); inputRef.current?.focus(); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>}
          </div>
          <p id={statusId} role="status" aria-live="polite" aria-atomic="true" className="mt-3 min-h-5 text-xs leading-5 text-muted">{status}</p>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4" aria-busy={loading}>
          {!canSearch && <div className="px-3 py-8 text-center sm:py-12">
            <p className="font-display text-lg font-bold">Follow your curiosity.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">Explore stories across news, tech, and culture. Start with a topic or a phrase.</p>
          </div>}
          {loading && <div aria-hidden="true" className="space-y-3 p-2 motion-safe:animate-pulse">
            {[0, 1, 2].map((row) => <div key={row} className="flex gap-4 rounded-2xl bg-surface p-3"><div className="h-16 w-16 shrink-0 rounded-xl bg-line" /><div className="flex-1 space-y-3 py-1"><div className="h-3 w-1/3 rounded bg-line" /><div className="h-4 w-full rounded bg-line" /><div className="h-3 w-2/3 rounded bg-line" /></div></div>)}
          </div>}
          {failed && <div className="px-3 py-8 text-center">
            <p className="text-sm leading-relaxed text-muted">We couldn’t load the results. Your search is still here.</p>
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-brand motion-safe:transition-colors">Try again</button>
          </div>}
          {canSearch && !loading && !failed && !results.length && <div className="px-3 py-8 text-center">
            <p className="font-display text-lg font-bold">A different angle?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Try a broader topic or check your spelling.</p>
          </div>}
          {results.length > 0 && <motion.ul
            key={search.query}
            aria-label="Search results"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.035 } } }}
            className="space-y-1"
          >
            {results.map((result) => {
              const time = publicationTime(result.published_at);
              return <motion.li key={result.slug} variants={{ hidden: { opacity: 0, y: reducedMotion ? 0 : 6 }, visible: { opacity: 1, y: 0 } }} transition={reducedMotion ? { duration: 0 } : softSpring}>
                <Link href={`/blog/${encodeURIComponent(result.slug)}`} onClick={onClose} className="group flex min-w-0 gap-3 rounded-2xl p-3 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand motion-safe:transition-colors sm:gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface font-display text-lg font-bold text-brand sm:h-20 sm:w-20">
                    {result.cover_image ? <Image src={result.cover_image} alt="" fill sizes="(max-width: 639px) 64px, 80px" className="object-cover" /> : <span aria-hidden="true">DB</span>}
                  </div>
                  <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                    <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium">
                      {result.categories?.name && <span className="font-bold uppercase tracking-wide text-brand">{result.categories.name}</span>}
                      {!!time && <time dateTime={result.published_at ?? undefined} className="text-muted">{new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>}
                    </div>
                    <h3 className="font-display text-sm font-bold leading-snug group-hover:text-brand sm:text-base">{result.title}</h3>
                    {result.excerpt && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm">{result.excerpt}</p>}
                  </div>
                </Link>
              </motion.li>;
            })}
          </motion.ul>}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3 text-[11px] text-muted sm:px-6">
          <span>Stories worth your time.</span>
          <span className="hidden sm:inline">Press <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans">Esc</kbd> to close</span>
        </div>
      </motion.div>
    </motion.dialog>
  );
}
