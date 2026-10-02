'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/components/motion/useReducedMotion';
import { createClient } from '@/lib/supabase/client';
import { softSpring } from '@/components/motion/Reveal';
import SearchOverlay from '@/components/site/SearchOverlay';
import MobileMenu from '@/components/site/MobileMenu';

type NavCategory = { name: string; slug: string };

export default function Header({
  categories,
  hasBreaking,
}: {
  categories: NavCategory[];
  hasBreaking: boolean;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const shouldReduceMotion = useReducedMotion();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const { scrollY } = useScroll();
  const paddingY = useTransform(scrollY, [0, 80], [20, 10]);
  const logoScale = useTransform(scrollY, [0, 80], [1, 0.88]);
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => setRole(profile?.role ?? null));
    });
  }, [supabase]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const dashboardHref = role === 'admin' ? '/admin' : role === 'editor' ? '/editor' : '/dashboard';

  const navItems = [
    { label: 'Latest', href: '/' },
    ...categories.map((c) => ({ label: c.name, href: `/section/${encodeURIComponent(c.slug)}` })),
    { label: 'Opinions', href: '/opinions' },
    { label: 'Videos', href: '/videos' },
  ];

  return (
    <>
      <motion.header
        style={{ paddingTop: shouldReduceMotion ? 16 : paddingY, paddingBottom: shouldReduceMotion ? 16 : paddingY }}
        className="sticky top-0 z-40 px-4 sm:px-5"
      >
        <motion.div
          style={{ opacity: shouldReduceMotion ? 1 : bgOpacity }}
          className="absolute inset-0 bg-paper/80 backdrop-blur-md"
        />
        <motion.div
          style={{ opacity: shouldReduceMotion ? 1 : borderOpacity }}
          className="absolute inset-x-0 bottom-0 h-px bg-line"
        />

        <div className="relative max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-3 sm:gap-x-4">
          <motion.div style={{ scale: shouldReduceMotion ? 1 : logoScale }} className="shrink-0 origin-left">
            <Link href="/" className="inline-flex min-h-11 items-center whitespace-nowrap text-2xl sm:text-3xl">
              <BrandLogo />
            </Link>
          </motion.div>

          <nav aria-label="Main navigation" className="order-last hidden w-full min-w-0 flex-wrap items-center justify-center gap-1 border-t border-line/60 pt-2 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative max-w-full min-h-11 inline-flex items-center px-3 py-2 text-sm font-semibold rounded-full motion-safe:transition-colors [overflow-wrap:anywhere] ${
                    active ? 'text-brand' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId={shouldReduceMotion ? undefined : "nav-active"}
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-brand rounded-full"
                      transition={shouldReduceMotion ? { duration: 0 } : softSpring}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {hasBreaking && (
              <Link
                href="/#breaking"
                className="hidden sm:flex min-h-11 items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-wide"
              >
                <span className="relative flex h-2 w-2">
                  {!shouldReduceMotion && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                </span>
                Breaking
              </Link>
            )}

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-surface motion-safe:transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </button>

            <Link
              href={role ? dashboardHref : '/write'}
              className="hidden sm:inline-flex min-h-11 items-center whitespace-nowrap px-4 py-2 rounded-full bg-ink text-white text-sm font-semibold hover:bg-brand motion-safe:transition-colors"
            >
              {role ? 'Dashboard' : 'Write for us'}
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              className="lg:hidden h-11 w-11 flex items-center justify-center rounded-full hover:bg-surface motion-safe:transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && <MobileMenu items={navItems} pathname={pathname} dashboardHref={role ? dashboardHref : '/write'} dashboardLabel={role ? 'Dashboard' : 'Write for us'} onClose={closeMenu} />}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
