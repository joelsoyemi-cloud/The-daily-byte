"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-xl px-5 py-20 text-center">
    <h1 className="font-display text-3xl font-bold">This page is temporarily unavailable.</h1>
    <p className="mt-4 text-muted">Please try again in a moment.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-4">
      <button type="button" onClick={reset} className="min-h-11 rounded-full bg-ink px-5 text-white">Try again</button>
      <Link href="/" className="inline-flex min-h-11 items-center text-brand underline">Visit the front page</Link>
    </div>
  </div>;
}
