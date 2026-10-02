import Link from "next/link";
import type { Role } from "@/lib/auth";
import type { NewsroomStory } from "@/lib/newsroom";
import { statusLabel, storyAction } from "@/lib/workspaces";
export function RoleBadge({ role }: { role: Role }) { return <span className="nr-role" data-role={role}><span className="sr-only">Role: </span>{statusLabel(role)}</span>; }
export function StatusBadge({ status }: { status: string }) { return <span className="nr-status" data-status={status}>{statusLabel(status)}</span>; }
export function CreateStoryLink() { return <Link href="/dashboard/articles/new" className="nr-button nr-button-primary"><span aria-hidden="true">+</span> Create Story</Link>; }
export function PageHeading({ eyebrow, title, description, create = true }: { eyebrow: string; title: string; description?: string; create?: boolean }) {
  return <header className="nr-page-heading"><div className="min-w-0"><p className="nr-eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="nr-description">{description}</p>}</div>{create && <CreateStoryLink />}</header>;
}
export function Metric({ label, value, href, tone = "ink" }: { label: string; value: number | null; href?: string; tone?: "ink" | "red" | "gold" | "teal" }) {
  const content = <><span className="nr-metric-label">{label}</span><strong>{value === null ? "—" : value.toLocaleString("en-US")}</strong><span className="nr-metric-note">{value === null ? "Unavailable" : href ? "View stories →" : "Across the newsroom"}</span></>;
  return href ? <Link href={href} className="nr-metric" data-tone={tone}>{content}</Link> : <div className="nr-metric" data-tone={tone}>{content}</div>;
}
export function Panel({ title, description, action, children }: { title: string; description?: string; action?: { href: string; label: string }; children: React.ReactNode }) {
  return <section className="nr-panel"><div className="nr-panel-heading"><div className="min-w-0"><h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <Link className="nr-text-link" href={action.href}>{action.label} <span aria-hidden="true">↗</span></Link>}</div>{children}</section>;
}
export function StoryList({ posts, editorial = false }: { posts: NewsroomStory[]; editorial?: boolean }) {
  return <ul className="nr-story-list">{posts.map(post => {
    const action = storyAction(post, editorial);
    const date = post.updated_at && !Number.isNaN(Date.parse(post.updated_at)) ? new Date(post.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
    return <li key={post.id} className="nr-story-row"><div className="min-w-0"><div className="nr-story-meta"><StatusBadge status={post.status} /><span>{post.categories?.name || "Uncategorized"}</span>{post.schools && <span>{post.schools.name}</span>}</div><h3><Link href={action.href}>{post.title || "Untitled story"}</Link></h3><p className="nr-story-byline">{editorial && <span>By {post.profiles?.display_name || "Unknown author"} · </span>}Updated {date ? <time dateTime={post.updated_at ?? undefined}>{date}</time> : "date unavailable"}</p></div>{!editorial && post.status === "published" && <Link href={"/dashboard/articles/" + encodeURIComponent(post.id)} className="nr-row-action" aria-label={"Share published story: " + post.title}>Share story</Link>}<Link href={action.href} className="nr-row-action" aria-label={action.label + ": " + (post.title || "Untitled story")}>{action.label} <span aria-hidden="true">↗</span></Link></li>;
  })}</ul>;
}
export function StoryFilters({ base, active, statuses, school }: { base: string; active: string; statuses: readonly string[]; school?: string }) {
  return <nav aria-label="Filter stories by status" className="nr-filters">{["all", ...statuses].map(status => <Link key={status} href={base + "?" + new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(school ? { school } : {}) }).toString()} aria-current={active === status ? "page" : undefined}>{status === "all" ? "All stories" : statusLabel(status)}</Link>)}</nav>;
}
export function ListPagination({ base, page, total, status, school }: { base: string; page: number; total: number; status?: string; school?: string }) {
  const pages = Math.max(1, Math.ceil(total / 20));
  const href = (next: number) => base + "?" + new URLSearchParams({ ...(status && status !== "all" ? { status } : {}), ...(school ? { school } : {}), page: String(next) }).toString();
  return <nav className="nr-pagination" aria-label="List pagination"><span>{total.toLocaleString("en-US")} results · Page {page} of {pages}</span><div>{page > 1 && <Link className="nr-button nr-button-secondary" href={href(page - 1)}>Previous</Link>}{page < pages && <Link className="nr-button nr-button-secondary" href={href(page + 1)}>Next</Link>}</div></nav>;
}
