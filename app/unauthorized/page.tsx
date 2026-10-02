import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { getCurrentProfile } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const profile = await getCurrentProfile();

  const home = profile?.status === "active" && profile.role !== "reader"
    ? profile.role === "admin"
      ? "/admin"
      : profile.role === "editor"
        ? "/editor"
        : "/dashboard"
    : "/";

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <BrandMark className="mb-6 h-8 w-8 mx-auto" />
      <h1 className="font-display font-900 text-2xl mb-3">Access denied</h1>
      <p className="text-muted mb-8">
        {reason === "profile" || !profile
          ? "We could not load your contributor profile. Try signing in again. If this continues, send feedback so an admin can help."
          : reason === "suspended"
          ? "Your account is currently suspended. Contact an admin if you think this is a mistake."
          : "You don't have permission to view that page."}
      </p>
      <Link
        href={home}
        className="inline-flex min-h-11 items-center bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors"
      >
        {home === "/" ? "Back to homepage" : "Back to your dashboard"}
      </Link>
      <Link href="/feedback" className="mt-4 flex min-h-11 items-center justify-center font-semibold text-brand underline">Send feedback</Link>
      <div className="mt-4 flex min-h-11 items-center justify-center"><SignOutButton /></div>
    </div>
  );
}
