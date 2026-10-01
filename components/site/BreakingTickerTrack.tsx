"use client";

import { useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

export default function BreakingTickerTrack({ posts }: { posts: { slug: string; title: string }[] }) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const moving = !paused && !reducedMotion;
  return (
    <>
      <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
        <div className={`flex w-max hover:[animation-play-state:paused] focus-within:[animation:none] ${moving ? "motion-safe:animate-ticker" : ""}`}>
          <ul className="flex shrink-0 items-center">{posts.map((post) => <li key={post.slug}><Link href={`/blog/${post.slug}`} className="inline-flex min-h-11 items-center whitespace-nowrap px-6 text-sm font-medium hover:text-white/75 motion-safe:transition-colors">{post.title}</Link></li>)}</ul>
          {moving && <div aria-hidden="true" className="flex shrink-0 items-center motion-reduce:hidden">{posts.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`} tabIndex={-1} className="inline-flex min-h-11 items-center whitespace-nowrap px-6 text-sm font-medium hover:text-white/75">{post.title}</Link>)}</div>}
        </div>
      </div>
      {!reducedMotion && <button type="button" aria-label={paused ? "Resume breaking headlines" : "Pause breaking headlines"} aria-pressed={paused} onClick={() => setPaused((value) => !value)} className="flex h-11 w-11 shrink-0 items-center justify-center border-l border-white/20 hover:bg-white/10">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">{paused ? <path d="M8 5v14l11-7z" /> : <path d="M6 5h4v14H6zm8 0h4v14h-4z" />}</svg>
      </button>}
    </>
  );
}
