import { requireAdmin } from "@/lib/auth";

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Platform Settings</h1>
      <div className="border-2 border-dashed border-line rounded px-6 py-10 text-center">
        <p className="text-muted text-sm">
          Nothing configurable here yet — no platform_settings table exists in
          the database. This page is a placeholder until specific settings (site
          name, default author bio, moderation rules, etc.) are actually needed,
          at which point a real table and form belong here instead of hardcoded
          values.
        </p>
      </div>
    </div>
  );
}
