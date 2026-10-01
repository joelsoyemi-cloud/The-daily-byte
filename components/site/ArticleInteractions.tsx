"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { softSpring } from "@/components/motion/Reveal";

export function ArticleReadingProgress({ targetId }: { targetId: string }) {
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, softSpring);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = target.getBoundingClientRect();
      // Start when the body enters the viewport; finish when its end is visible.
      const distance = window.innerHeight - bounds.top;
      progress.set(Math.max(0, Math.min(1, distance / Math.max(1, bounds.height))));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(target);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [progress, targetId]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1">
      <motion.div className="h-full origin-left bg-brand" style={{ scaleX: reducedMotion ? progress : smoothProgress }} />
    </div>
  );
}

export default function ArticleInteractions({ title, url }: { title: string; url: string }) {
  const [canShare, setCanShare] = useState(false);
  const [message, setMessage] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function announce(value: string) {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setMessage(value);
    resetTimer.current = setTimeout(() => setMessage(""), 3000);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setManualCopy(false);
      announce("Copied!");
    } catch {
      setManualCopy(true);
      announce("Select and copy the link below.");
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      await copyLink();
    }
  }

  const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold shadow-soft hover:border-brand/30 hover:bg-brand/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand motion-safe:transition motion-safe:active:scale-95";

  return (
    <div className="space-y-3" aria-label="Share this article" role="group">
      <div className="flex flex-wrap items-center gap-3">
        <span className="mr-1 w-full text-xs font-bold uppercase tracking-widest text-muted sm:w-auto">Share this story</span>
        {canShare && (
          <button type="button" onClick={share} className={buttonClass} aria-label="Share this article">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 16V3m-5 5 5-5 5 5M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share
          </button>
        )}
        <button type="button" onClick={copyLink} className={buttonClass} aria-label="Copy article link">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
          </svg>
          {message === "Copied!" ? "Copied!" : "Copy link"}
        </button>
        <span role="status" aria-live="polite" className="text-xs text-muted">{message}</span>
      </div>
      {manualCopy && (
        <label className="block text-sm text-muted">
          Article link
          <input readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink" />
        </label>
      )}
    </div>
  );
}
