import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import SignOutButton from '@/components/SignOutButton';
import type { Profile } from '@/lib/auth';

export type NavItem = { href: string; label: string };

export default function DashboardShell({
  profile,
  areaLabel,
  nav,
  children,
}: {
  profile: Profile;
  areaLabel: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="w-56 shrink-0 bg-white border-r-2 border-ink hidden sm:flex flex-col">
        <div className="px-5 py-5 border-b border-line">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-md"><BrandLogo className="text-sm" /></Link>
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand mt-1">
            {areaLabel}
          </p>
        </div>
        <nav className="flex-1 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-5 py-2 text-sm font-medium text-ink/80 hover:bg-surface hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-line text-xs text-muted">
          <p className="font-semibold text-ink mb-2">{profile.display_name}</p>
          <div className="flex flex-col gap-2">
            <Link href="/" className="hover:text-brand">
              View site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="sm:hidden border-b-2 border-ink bg-white px-5 py-3 flex items-center justify-between">
          <span className="font-display font-900 text-sm">{areaLabel}</span>
          <SignOutButton />
        </div>
        <div className="sm:hidden flex gap-3 overflow-x-auto px-5 py-2 bg-white border-b border-line text-xs font-bold uppercase tracking-wide">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap text-muted hover:text-brand">
              {item.label}
            </Link>
          ))}
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}