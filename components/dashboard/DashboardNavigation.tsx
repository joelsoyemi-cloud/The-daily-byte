"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
import SignOutButton from "@/components/SignOutButton";
import type { Role } from "@/lib/auth";
import { workspaceLinks, WORKSPACE_LABELS, type Workspace } from "@/lib/workspaces";
import type { NavItem } from "./DashboardShell";
import { RoleBadge } from "./WorkspaceUI";
export default function DashboardNavigation({ role, displayName, workspace, nav }: { role: Role; displayName: string; workspace: Workspace; nav: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(pathname);
  useEffect(() => { if (previousPath.current !== pathname) setOpen(false); previousPath.current = pathname; }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const opener = trigger.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", resize);
    return () => { media.removeEventListener("change", resize); element?.close(); document.body.style.overflow = previousOverflow; if (opener?.getClientRects().length) opener.focus(); };
  }, [open]);
  const links = workspaceLinks(role);
  const activeHref = nav.filter(item => pathname === item.href || pathname.startsWith(item.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const contents = (mobile: boolean) => <><div className="nr-sidebar-brand"><Link href="/" aria-label="The Daily Byte home"><BrandLogo className="text-lg" /></Link>{mobile && <button type="button" className="nr-icon-button" aria-label="Close workspace menu" onClick={() => setOpen(false)}>✕</button>}</div>
    <div className="nr-workspace-title"><p className="nr-eyebrow">Current workspace</p><p className="font-display text-xl font-bold">{WORKSPACE_LABELS[workspace]}</p><RoleBadge role={role} /></div>
    <details className="nr-switcher"><summary>Switch workspace <span aria-hidden="true">⌄</span></summary><nav aria-label="Switch workspace">{links.map(link => <Link key={link.id} href={link.href} onClick={() => setOpen(false)} aria-current={link.id === workspace ? "true" : undefined}>{link.label}{link.id === workspace && <span className="sr-only"> (current workspace)</span>}<span aria-hidden="true">{link.id === workspace ? "•" : "↗"}</span></Link>)}</nav></details>
    <Link href="/dashboard/articles/new" className="nr-button nr-button-primary nr-sidebar-create" onClick={() => setOpen(false)}>+ Create Story</Link>
    <nav aria-label={WORKSPACE_LABELS[workspace] + " navigation"} className="nr-navigation">{nav.map((item, index) => <Link key={item.href} href={item.href} aria-current={activeHref === item.href ? "page" : undefined} onClick={() => setOpen(false)}><span aria-hidden="true" className="nr-nav-index">{String(index + 1).padStart(2, "0")}</span>{item.label}</Link>)}</nav>
    <div className="nr-sidebar-profile"><span className="nr-avatar-initial" aria-hidden="true">{displayName?.trim().charAt(0).toUpperCase() || "DB"}</span><div className="min-w-0"><Link href="/dashboard/profile" onClick={() => setOpen(false)} className="font-semibold break-words">{displayName || "Your profile"}</Link><p className="text-xs text-muted mt-1">Your newsroom profile</p></div></div>
    <div className="nr-sidebar-bottom"><Link href="/" onClick={() => setOpen(false)}>Public Site ↗</Link><SignOutButton /></div></>;
  return <><aside className="nr-sidebar">{contents(false)}</aside><div className="nr-mobile-topbar"><div className="min-w-0"><p className="font-display font-bold">{WORKSPACE_LABELS[workspace]}</p><RoleBadge role={role} /></div><button type="button" ref={trigger} onClick={() => setOpen(true)} className="nr-icon-button" aria-label="Open workspace menu" aria-expanded={open} aria-controls="workspace-menu"><span aria-hidden="true">☰</span></button></div>
    {open && <dialog ref={dialog} id="workspace-menu" className="nr-drawer" aria-label={WORKSPACE_LABELS[workspace] + " menu"} onCancel={event => { event.preventDefault(); setOpen(false); }} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) setOpen(false); } }}>{contents(true)}</dialog>}</>;
}
