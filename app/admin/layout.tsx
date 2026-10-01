import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };
import { requireAdmin } from "@/lib/auth";
import DashboardShell, {
  type NavItem,
} from "@/components/dashboard/DashboardShell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/editor/submissions", label: "Submission Queue" },
  { href: "/editor/articles", label: "Articles" },
  { href: "/editor/categories", label: "Categories" },
  { href: "/editor/media", label: "Media" },
  { href: "/editor/activity", label: "Review Activity" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/settings", label: "Platform Settings" },
  { href: "/admin/advertising", label: "Advertising" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  return (
    <DashboardShell profile={profile} areaLabel="Admin" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
