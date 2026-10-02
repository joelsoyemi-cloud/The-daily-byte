import Link from "next/link";
import BetaNotice from "@/components/site/BetaNotice";
import BrandLogo from "@/components/brand/BrandLogo";
import { Reveal } from "@/components/motion/Reveal";

export default function Footer({ categories }: { categories: { name: string; slug: string }[] }) {
  const linkStyle = "inline-flex min-h-11 items-center rounded-md text-sm text-muted underline-offset-4 hover:text-brand hover:underline motion-safe:transition-colors";
  return (
    <footer className="mt-16 border-t border-line bg-surface sm:mt-24">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <Reveal>
          <div className="grid min-w-0 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.5fr] lg:gap-12">
            <div className="min-w-0">
              <Link href="/" className="inline-flex min-h-11 items-center rounded-md text-3xl"><BrandLogo /></Link>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted">News, tech, and culture. Fresh perspectives and stories worth making time for.</p>
              <p className="mt-6 font-display text-lg font-bold">Stay in the loop.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">Make The Daily Byte part of your daily reading.</p>
            </div>
            <nav aria-label="Footer main navigation">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink">Explore</h2>
              <ul><li><Link href="/feedback" className={linkStyle}>Report a problem / Send feedback</Link></li><li><Link href="/schools" className={linkStyle}>Campus network</Link></li><li><Link href="/" className={linkStyle}>Latest stories</Link></li><li><Link href="/opinions" className={linkStyle}>Opinions</Link></li><li><Link href="/videos" className={linkStyle}>Videos</Link></li></ul>
              <Link href="/write" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-brand motion-safe:transition-colors">Write for The Daily Byte <span aria-hidden="true" className="ml-2">&rarr;</span></Link>
            </nav>
            {categories.length > 0 && <nav aria-label="Footer sections" className="min-w-0 sm:col-span-2 lg:col-span-1">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink">Our sections</h2>
              <ul className="grid grid-cols-2 gap-x-4">{categories.map((category) => <li key={category.slug} className="min-w-0"><Link href={`/section/${encodeURIComponent(category.slug)}`} className={`${linkStyle} max-w-full [overflow-wrap:anywhere]`}>{category.name}</Link></li>)}</ul>
            </nav>}
          </div>
        </Reveal>
        <div className="mt-8"><BetaNotice /></div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} The Daily Byte</p>
          <Link href="#main-content" className="inline-flex min-h-11 items-center rounded-md hover:text-brand">Back to content <span aria-hidden="true" className="ml-2">&uarr;</span></Link>
        </div>
      </div>
    </footer>
  );
}
