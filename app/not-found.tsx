import Link from "next/link";

export default function NotFound() {
  return <div className="mx-auto max-w-xl px-5 py-20 text-center">
    <h1 className="font-display text-3xl font-bold">Page not found</h1>
    <p className="mt-4 text-muted">This page may have moved or is no longer available.</p>
    <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-white">Visit the front page</Link>
  </div>;
}
