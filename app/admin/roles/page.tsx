import { requireAdmin } from "@/lib/auth";

const ROLES = [
  {
    name: "Reader",
    description:
      "A signed-in visitor with no publishing permissions. Reserved for future features (comments, saved articles).",
  },
  {
    name: "Contributor",
    description:
      "Can write and edit their own drafts, and submit them for editorial review. Cannot publish directly, edit anyone else's article, or see anyone else's drafts.",
  },
  {
    name: "Author",
    description:
      "Same permissions as Contributor today. Reserved as a distinct tier for future use (e.g. a trusted-contributor status with lighter review).",
  },
  {
    name: "Editor",
    description:
      "Can review, edit, approve, publish, reject, or request changes on any article regardless of author. Can manage categories and media. Cannot manage users or platform settings.",
  },
  {
    name: "Admin",
    description:
      "Everything an Editor can do, plus managing user roles/status and platform-level settings.",
  },
];

export default async function RolesPage() {
  await requireAdmin();

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-2">Roles</h1>
      <p className="text-muted text-sm mb-6">
        What each role can actually do — enforced at the database level, not
        just hidden in the UI. To change someone's role, go to Users.
      </p>

      <ul className="divide-y divide-line border-t border-line">
        {ROLES.map((r) => (
          <li key={r.name} className="py-4">
            <p className="font-display font-700 mb-1">{r.name}</p>
            <p className="text-sm text-muted">{r.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
