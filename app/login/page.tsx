"use client";

import { Suspense, useState } from "react";
import { safeRedirectPath } from "@/lib/safe-redirect";
import BrandMark from "@/components/brand/BrandMark";
import BrandLogo from "@/components/brand/BrandLogo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmationResend from "@/components/ConfirmationResend";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    router.push(safeRedirectPath(next, profile?.role === "reader" ? "/" : "/dashboard"));
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-24 [overflow-wrap:anywhere]">
      <Link href="/" aria-label="The Daily Byte home" className="mb-6 inline-flex min-h-11 items-center gap-3 rounded-md">
        <BrandMark decorative className="h-8 w-8" />
        <BrandLogo className="text-2xl" />
      </Link>
      <h1 className="font-display font-900 text-2xl mb-8">Sign in</h1>

      {searchParams.get("error") === "invalid-link" && <p role="alert" className="mb-5 text-sm text-brand">This sign-in link is invalid or has expired. Request a new link and try again.</p>}
      {searchParams.get("error") === "invalid-link" && <p className="mb-5 text-sm text-muted">For a password reset, use <Link href="/forgot-password" className="inline-flex min-h-11 items-center underline">Request a new reset link</Link>. If you were confirming signup, try signing in first or use <Link href="/feedback" className="inline-flex min-h-11 items-center underline">Send feedback</Link> for help.</p>}
      {searchParams.get("error") === "invalid-link" && <ConfirmationResend />}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-base"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            autoComplete="current-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-11 w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-base"
          />
        </div>

        {error && <p role="alert" className="text-brand text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 flex justify-between text-xs font-medium text-muted">
        <Link href="/forgot-password" className="hover:text-brand">
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:text-brand">
          Become a contributor →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
