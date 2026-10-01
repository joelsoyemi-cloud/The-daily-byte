"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/brand/BrandMark";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto px-5 py-24 text-center text-muted">
        <BrandMark className="mb-6 h-8 w-8 mx-auto" />
        Verifying your reset link…
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-5 py-24 text-center">
        <BrandMark className="mb-6 h-8 w-8 mx-auto" />
        <h1 className="font-display font-900 text-2xl mb-3">
          Password updated
        </h1>
        <p className="text-muted">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-24">
      <BrandMark className="mb-6 h-8 w-8" />
      <h1 className="font-display font-900 text-2xl mb-8">
        Set a new password
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            New password
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
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
