"use client";

import { useEffect, useRef, useState } from "react";

const POSTER = "/brand/the-daily-byte-og.png";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionAllowed(!preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!motionAllowed || failed) return;
    setPaused(false);
    const video = videoRef.current;
    video?.play().catch(() => setFailed(true));
  }, [motionAllowed, failed]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      try {
        await video.play();
        setPaused(false);
      } catch {
        setFailed(true);
      }
    } else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* The static brand asset also works before hydration or without JavaScript. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={POSTER} alt="" fetchPriority="high" className="h-full w-full object-cover" />
        {motionAllowed && !failed && (
          <video
            ref={videoRef}
            src="/media/daily-byte-hero.mp4"
            poster={POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-left md:object-top"
          />
        )}
      </div>
      {motionAllowed && !failed && (
        <button
          type="button"
          onClick={togglePlayback}
          className="absolute right-4 top-4 z-20 min-h-11 rounded-full border border-white/40 bg-black/70 px-4 text-xs font-semibold text-white hover:bg-black/90 focus-visible:outline-white sm:right-6 sm:top-6"
          aria-label={paused ? "Play background video" : "Pause background video"}
        >
          {paused ? "Play video" : "Pause video"}
        </button>
      )}
    </>
  );
}
