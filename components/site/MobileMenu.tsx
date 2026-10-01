"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { softSpring } from "@/components/motion/Reveal";

export default function MobileMenu({ items, pathname, dashboardHref, dashboardLabel, onClose }: {
  items: { label: string; href: string }[];
  pathname: string;
  dashboardHref: string;
  dashboardLabel: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    desktop.addEventListener("change", closeOnDesktop);
    closeOnDesktop();
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog?.close();
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <motion.dialog ref={dialogRef} aria-labelledby={titleId} aria-modal="true"
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-ink backdrop:bg-transparent"
      initial="hidden" animate="visible" exit="hidden"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <motion.div aria-hidden="true" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} transition={{ duration: reducedMotion ? 0 : 0.18 }} />
      <motion.div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto overscroll-contain rounded-l-3xl bg-paper px-5 py-5 shadow-soft-lg sm:px-6 sm:py-6"
        variants={{ hidden: { opacity: 0, x: reducedMotion ? 0 : "100%" }, visible: { opacity: 1, x: 0 } }} transition={reducedMotion ? { duration: 0 } : softSpring}>
        <div className="mb-6 flex items-center justify-between gap-3"><h2 id={titleId} className="font-display text-lg font-black">Menu</h2><button type="button" onClick={onClose} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg></button></div>
        <motion.nav aria-label="Mobile navigation" variants={{ hidden: {}, visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.04 } } }} className="flex flex-col gap-1">
          {items.map((item) => <motion.div key={item.href} variants={{ hidden: { opacity: 0, x: reducedMotion ? 0 : 12 }, visible: { opacity: 1, x: 0 } }} transition={reducedMotion ? { duration: 0 } : softSpring}>
            <Link href={item.href} onClick={onClose} aria-current={pathname === item.href ? "page" : undefined} className={`block min-h-11 rounded-2xl px-3 py-3 text-lg font-semibold [overflow-wrap:anywhere] hover:bg-surface motion-safe:transition-colors ${pathname === item.href ? "bg-brand/5 text-brand" : ""}`}>{item.label}</Link>
          </motion.div>)}
          <div className="mt-4 border-t border-line pt-4"><Link href={dashboardHref} onClick={onClose} className="block min-h-11 rounded-2xl bg-ink px-3 py-3 text-center font-semibold text-white hover:bg-brand motion-safe:transition-colors">{dashboardLabel}</Link></div>
        </motion.nav>
      </motion.div>
    </motion.dialog>
  );
}
