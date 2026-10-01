import type { Role } from "./auth";
export type Workspace = "writing" | "editorial" | "admin";
export type WorkspaceLink = { id: Workspace | "public"; label: string; href: string };
export const WORKSPACE_LABELS: Record<Workspace, string> = { writing: "Writing Workspace", editorial: "Editorial Workspace", admin: "Admin Workspace" };
// Navigation only: server guards and RLS remain the authorization boundary.
export function workspaceLinks(role: Role): WorkspaceLink[] {
  const links: WorkspaceLink[] = [];
  if (role === "admin") links.push({ id: "admin", label: "Admin", href: "/admin" });
  if (role === "editor" || role === "admin") links.push({ id: "editorial", label: "Editorial", href: "/editor" });
  if (["contributor", "author", "editor", "admin"].includes(role)) links.push({ id: "writing", label: "Writing", href: "/dashboard" });
  links.push({ id: "public", label: "Public Site", href: "/" });
  return links;
}
export const STORY_STATUSES = ["draft", "submitted", "under_review", "changes_requested", "approved", "scheduled", "published", "rejected", "archived"] as const;
export function statusLabel(status: string): string { return status.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase()); }
export function storyAction(post: { id: string; slug: string; status: string }, editorial = false) {
  if (editorial) return { href: "/editor/articles/" + encodeURIComponent(post.id) + "/edit", label: "Open story" };
  if (post.status === "published") return { href: "/blog/" + encodeURIComponent(post.slug), label: "View story" };
  const base = "/dashboard/articles/" + encodeURIComponent(post.id);
  if (post.status === "draft") return { href: base + "/edit", label: "Continue writing" };
  if (post.status === "changes_requested") return { href: base + "/edit", label: "Review changes" };
  return { href: base, label: "View" };
}
