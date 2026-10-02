"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function ConfirmationResend({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <form className="mt-6 space-y-3 text-left" aria-busy={busy} onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const { error } = await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin + "/login" } }); setMessage(error ? "A confirmation link could not be requested. Wait a minute and try again." : "If your account needs confirmation, a new link will arrive by email. Check your spam folder too."); }
    catch { setMessage("Check your connection and try again."); }
    finally { setBusy(false); }
  }}><label htmlFor="confirmation-email" className="block text-sm font-semibold">Signup email</label><input id="confirmation-email" autoComplete="email" type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 py-2 text-base" /><button disabled={busy} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Requesting…" : "Resend signup confirmation"}</button>{message && <p role="status" className="text-sm leading-relaxed text-muted">{message}</p>}</form>;
}
