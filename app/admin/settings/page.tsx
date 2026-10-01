import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeading, Panel } from "@/components/dashboard/WorkspaceUI";
export default async function SettingsPage() {
  await requireAdmin();
  return <div><PageHeading eyebrow="Publication operations" title="Platform settings" description="Manage the people and permissions behind the publication." /><Panel title="People & access"><div className="nr-action-list"><Link href="/admin/users">Manage users and access <span aria-hidden="true">↗</span></Link><Link href="/admin/roles">Review role permissions <span aria-hidden="true">↗</span></Link></div></Panel><section className="nr-callout"><h2>Publication configuration</h2><p>There are no additional settings to change here yet. Operational configuration is managed by your deployment administrator.</p></section></div>;
}
