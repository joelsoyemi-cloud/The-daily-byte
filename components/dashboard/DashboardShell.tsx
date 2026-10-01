import type { Profile } from "@/lib/auth";
import type { Workspace } from "@/lib/workspaces";
import DashboardNavigation from "./DashboardNavigation";
import "./newsroom.css";
export type NavItem = { href: string; label: string };
export default function DashboardShell({ profile, workspace, nav, children }: { profile: Profile; workspace: Workspace; nav: NavItem[]; children: React.ReactNode }) {
  return <div className="newsroom"><a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3">Skip workspace navigation</a><DashboardNavigation role={profile.role} displayName={profile.display_name} workspace={workspace} nav={nav} /><div className="nr-content" id="workspace-content" tabIndex={-1}>{children}</div></div>;
}
