import { requireEditor } from "@/lib/auth";
import DashboardShell, {
  type NavItem,
} from "@/components/dashboard/DashboardShell";

const NAV: NavItem[] = [
  { href: "/editor", label: "Overview" },
  { href: "/editor/submissions", label: "Submission Queue" },
  { href: "/editor/articles", label: "Articles" },
  { href: "/editor/authors", label: "Authors" },
  { href: "/editor/categories", label: "Categories" },
  { href: "/editor/media", label: "Media" },
  { href: "/editor/activity", label: "Review Activity" },
];

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireEditor();
  return (
    <DashboardShell profile={profile} areaLabel="Editorial" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
