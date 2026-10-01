import type { Metadata } from "next";
export const metadata: Metadata = { robots: { index: false, follow: false } };
import { requireContributor } from "@/lib/auth";
import DashboardShell, {
  type NavItem,
} from "@/components/dashboard/DashboardShell";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/articles", label: "My Stories" },
  { href: "/dashboard/articles/new", label: "Create Story" },
  { href: "/dashboard/headlines", label: "Headlines" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireContributor();

  return (
    <DashboardShell profile={profile} workspace="writing" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
