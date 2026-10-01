import Link from "next/link";
import { PAGE_SIZE } from "@/lib/public-listings";

export default function Pagination({ page, count, path }: { page: number; count: number; path: string }) {
  const pages = Math.ceil(count / PAGE_SIZE);
  if (pages <= 1) return null;
  const href = (number: number) => number === 1 ? path : `${path}?page=${number}`;
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])].filter((number) => number >= 1 && number <= pages).sort((a, b) => a - b);
  const style = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line px-3 text-sm font-semibold hover:border-brand hover:text-brand motion-safe:transition-colors";
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-8 sm:mt-14">
      {page > 1 && <Link href={href(page - 1)} rel="prev" className={style} aria-label="Previous page">&larr; <span className="ml-2 hidden sm:inline">Previous</span></Link>}
      {numbers.map((number, index) => <span key={number} className="inline-flex items-center gap-2">
        {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true" className="text-muted">…</span>}
        <Link href={href(number)} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} className={`${style} ${number === page ? "border-ink bg-ink text-white hover:text-white" : "bg-white"}`}>{number}</Link>
      </span>)}
      {page < pages && <Link href={href(page + 1)} rel="next" className={style} aria-label="Next page"><span className="mr-2 hidden sm:inline">Next</span> &rarr;</Link>}
    </nav>
  );
}
