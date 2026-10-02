"use client";

import { useState } from "react";
import BrandMark from "@/components/brand/BrandMark";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BetaNotice from "@/components/site/BetaNotice";
import ConfirmationResend from "@/components/ConfirmationResend";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSubmitted(true);
    }
    } catch {
      setError("Unable to create your account right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-sm mx-auto px-5 py-24 text-center [overflow-wrap:anywhere]">
        <BrandMark className="mb-6 h-8 w-8 mx-auto" />
        <h1 className="font-display font-900 text-2xl mb-3">
          Check your email
        </h1>
        <p className="text-muted">
          If your signup is eligible, a confirmation link will arrive at <strong>{email}</strong>. Follow it to
          activate your account, then sign in. Check your spam folder too.
        </p>
        <Link href="/login" className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand hover:underline">Continue to sign in</Link>
        <ConfirmationResend initialEmail={email} />
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-24 [overflow-wrap:anywhere]">
      <BrandMark className="mb-6 h-8 w-8" />
      <h1 className="font-display font-900 text-2xl mb-2">
        Become a contributor
      </h1>
      <p className="text-muted text-sm mb-8">
        Anyone can submit a story. Our editors review everything before it goes
        live.
      </p>

      <div className="mb-6"><BetaNotice /></div>
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Name
          </label>
          <input id="name" autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-base"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Email
          </label>
          <input id="email" autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-base"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Password
          </label>
          <input id="password" autoComplete="new-password"
            type="password"
            required
            minLength={6}
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs font-medium text-muted">
        Already have an account?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
