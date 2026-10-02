"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { prepareAvatar } from "@/lib/avatar-client";
import { uploadAvatar } from "@/app/dashboard/profile/avatar-actions";
export default function AvatarUpload({ url, name }: { url: string | null; name: string }) {
  const [current, setCurrent] = useState(url), [busy, setBusy] = useState(false), [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();
  return <section className="mb-6 min-w-0" aria-label="Profile picture"><div className="mb-5"><Avatar url={current} name={name} size={96} /></div><label htmlFor="profile-avatar" className="block text-sm font-semibold">{current ? "Change profile picture" : "Upload profile picture"}</label><input id="profile-avatar" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} aria-describedby="avatar-note" className="mt-2 block min-h-11 w-full min-w-0 max-w-full text-sm file:mr-2 file:min-h-11 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:text-sm" onChange={async event => {
    const input = event.currentTarget, file = input.files?.[0]; if (!file) return;
    setBusy(true); setResult(null);
    try { const data = new FormData(); data.set("avatar", await prepareAvatar(file)); const response = await uploadAvatar(data); setResult(response); if (response.ok && response.url) { setCurrent(response.url); router.refresh(); } }
    catch (error) { const message = error instanceof Error ? error.message : ""; setResult({ ok: false, message: /^(Choose|This|Image processing)/.test(message) ? message : "Your picture could not be uploaded. Check your connection and sign-in, then try again." }); }
    finally { setBusy(false); input.value = ""; }
  }} /><p id="avatar-note" className="mt-2 text-xs leading-relaxed text-muted">JPEG, PNG, or WebP, up to 2 MB. Your picture is public. It is resized without cropping; saving happens automatically.</p>{busy && <p role="status" className="mt-3 text-sm">Uploading your picture…</p>}{result && <p role={result.ok ? "status" : "alert"} className="mt-3 text-sm">{result.message}</p>}</section>;
}
