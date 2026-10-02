"use client";
import { useState } from "react";
import { updateFeedbackStatus } from "@/app/admin/feedback/actions";
import { FEEDBACK_STATUSES } from "@/lib/feedback";
export default function FeedbackStatusForm({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(status), [busy, setBusy] = useState(false), [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return <form className="mt-5 flex flex-wrap items-center gap-3" aria-busy={busy} onSubmit={async event => { event.preventDefault(); setBusy(true); try { setResult(await updateFeedbackStatus(id, value)); } catch { setResult({ ok: false, message: "Unable to update the report. Please try again." }); } finally { setBusy(false); } }}><label htmlFor={"status-" + id} className="text-sm font-semibold">Status</label><select id={"status-" + id} value={value} onChange={event => setValue(event.target.value)} className="min-h-11 rounded-xl border border-line bg-white px-3">{FEEDBACK_STATUSES.map(item => <option key={item} value={item}>{item}</option>)}</select><button className="nr-button nr-button-secondary" disabled={busy}>{busy ? "Saving…" : "Save status"}</button>{result && <p role={result.ok ? "status" : "alert"} className="w-full text-sm">{result.message}</p>}</form>;
}
