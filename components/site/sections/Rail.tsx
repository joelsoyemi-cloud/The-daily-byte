"use client";

import { useId, useRef, useState, useEffect } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";

export default function Rail({ posts }: { posts: StoryCardPost[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollerId = useId();
  const reducedMotion = useReducedMotion();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }

  useEffect(() => {
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    if (scrollerRef.current) observer.observe(scrollerRef.current);
    return () => observer.disconnect();
  }, [posts]);

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reducedMotion ? "instant" : "smooth" });
  }

  return (
    <div className="relative min-w-0">
      <div
        id={scrollerId}
        tabIndex={0}
        role="region"
        aria-label="Scrollable stories"
        ref={scrollerRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory motion-safe:scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => (
          <div
            key={post.slug}
            className="snap-start shrink-0 w-[260px] sm:w-[280px]"
          >
            <StoryCard post={post} size="rail" />
          </div>
        ))}
      </div>

      <button
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        aria-controls={scrollerId}
        disabled={!canScrollLeft}
        className={`hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-soft-lg items-center justify-center motion-safe:transition-opacity motion-safe:duration-200 ${
          canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M15 18l-6-6 6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        aria-controls={scrollerId}
        disabled={!canScrollRight}
        className={`hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-soft-lg items-center justify-center motion-safe:transition-opacity motion-safe:duration-200 ${
          canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M9 18l6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
