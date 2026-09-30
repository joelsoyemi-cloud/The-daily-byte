import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const profile = await getCurrentProfile();

  const home = profile
    ? profile.role === "admin"
      ? "/admin"
      : profile.role === "editor"
        ? "/editor"
        : "/dashboard"
    : "/";

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <h1 className="font-display font-900 text-2xl mb-3">Access denied</h1>
      <p className="text-muted mb-8">
        {reason === "suspended"
          ? "Your account is currently suspended. Contact an admin if you think this is a mistake."
          : "You don't have permission to view that page."}
      </p>
      <Link
        href={home}
        className="inline-block bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors"
      >
        {profile ? "Back to your dashboard" : "Back to homepage"}
      </Link>
    </div>
  );
}
