"use client";

import { useState } from "react";
import BrandMark from "@/components/brand/BrandMark";
import BrandLogo from "@/components/brand/BrandLogo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
    } catch { setError("A reset link could not be requested. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  if (sent) {
    return (
      <div className="max-w-sm mx-auto px-5 py-24 [overflow-wrap:anywhere] text-center">
        <Link href="/" aria-label="The Daily Byte home" className="mb-6 inline-flex min-h-11 items-center gap-3 rounded-md">
          <BrandMark decorative className="h-8 w-8" />
          <BrandLogo className="text-2xl" />
        </Link>
        <h1 className="font-display font-900 text-2xl mb-3">
          Check your email
        </h1>
        <p className="text-muted">
          If an account exists for <strong>{email}</strong>, a reset link is on
          its way.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-24 [overflow-wrap:anywhere]">
      <Link href="/" aria-label="The Daily Byte home" className="mb-6 inline-flex min-h-11 items-center gap-3 rounded-md">
        <BrandMark decorative className="h-8 w-8" />
        <BrandLogo className="text-2xl" />
      </Link>
      <h1 className="font-display font-900 text-2xl mb-8">
        Reset your password
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {error && <p role="alert" className="text-brand text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-11 w-full bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
