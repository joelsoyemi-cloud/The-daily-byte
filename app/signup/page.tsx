"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
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

    const { error } = await supabase.auth.signUp({
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

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-sm mx-auto px-5 py-24 text-center">
        <h1 className="font-display font-900 text-2xl mb-3">
          Check your email
        </h1>
        <p className="text-muted">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then come back and sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <h1 className="font-display font-900 text-2xl mb-2">
        Become a contributor
      </h1>
      <p className="text-muted text-sm mb-8">
        Anyone can submit a story. Our editors review everything before it goes
        live.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
          />
        </div>

        {error && <p className="text-brand text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs font-medium text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
