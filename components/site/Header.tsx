'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { softSpring } from '@/components/motion/Reveal';

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
    ...categories.map((c) => ({ label: c.name, href: `/section/${c.slug}` })),
    { label: 'Opinions', href: '/opinions' },
    { label: 'Videos', href: '/videos' },
  ];

  return (
    <>
      <motion.header
        style={{ paddingTop: paddingY, paddingBottom: paddingY }}
        className="sticky top-0 z-40 px-5"
      >
        <motion.div
          style={{ opacity: bgOpacity }}
          className="absolute inset-0 bg-paper/80 backdrop-blur-md"
        />
        <motion.div
          style={{ opacity: borderOpacity }}
          className="absolute inset-x-0 bottom-0 h-px bg-line"
        />

        <div className="relative max-w-6xl mx-auto flex items-center justify-between gap-4">
          <motion.div style={{ scale: logoScale }} className="origin-left">
            <Link href="/" className="font-display font-900 text-2xl tracking-tight">
              The Daily<span className="text-brand">Byte</span>
            </Link>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-semibold rounded-full transition-colors ${
                    active ? 'text-brand' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 bg-brand rounded-full"
                      transition={softSpring}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {hasBreaking && (
              <Link
                href="/#breaking"
                className="hidden sm:flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-wide"
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
              className="p-2.5 rounded-full hover:bg-surface transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </button>

            <Link
              href={role ? dashboardHref : '/signup'}
              className="hidden sm:inline-block px-4 py-2 rounded-full bg-ink text-white text-sm font-semibold hover:bg-brand transition-colors"
            >
              {role ? 'Dashboard' : 'Write for us'}
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2.5 rounded-full hover:bg-surface transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={softSpring}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-paper shadow-soft-lg px-6 py-6 rounded-l-3xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-display font-900 text-lg">Menu</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-full hover:bg-surface"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <motion.nav
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                className="flex flex-col gap-1"
              >
                {navItems.map((item) => (
                  <motion.div
                    key={item.href}
                    variants={{ hidden: { opacity: 0, x: 16 }, visible: { opacity: 1, x: 0 } }}
                  >
                    <Link
                      href={item.href}
                      className="block px-3 py-3 rounded-2xl text-lg font-semibold hover:bg-surface transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={{ hidden: { opacity: 0, x: 16 }, visible: { opacity: 1, x: 0 } }}
                  className="mt-4 pt-4 border-t border-line"
                >
                  <Link
                    href={role ? dashboardHref : '/signup'}
                    className="block px-3 py-3 rounded-2xl bg-ink text-white text-center font-semibold"
                  >
                    {role ? 'Dashboard' : 'Write for us'}
                  </Link>
                </motion.div>
              </motion.nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {searchOpen && <SearchOverlayPlaceholder onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function SearchOverlayPlaceholder({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg mx-4 shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-muted">Search coming later this phase.</p>
      </div>
    </div>
  );
}