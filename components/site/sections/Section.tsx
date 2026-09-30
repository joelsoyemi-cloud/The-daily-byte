import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

export default function Section({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-6xl mx-auto px-5 py-10 sm:py-14">
      <Reveal className="flex items-center justify-between mb-6 sm:mb-8">
        <h2 className="font-display font-900 text-xl sm:text-2xl">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-semibold text-brand hover:underline flex items-center gap-1"
          >
            View all
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
      </Reveal>
      {children}
    </section>
  );
}
