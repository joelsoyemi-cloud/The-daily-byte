"use client";
import SchoolSelect from "@/components/SchoolSelect";
import type { SchoolOption } from "@/lib/schools";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth";
import { PageHeading, RoleBadge } from "./WorkspaceUI";
export default function ProfileForm({ profile, schools }: { profile: Profile; schools: SchoolOption[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [schoolId, setSchoolId] = useState(profile.school_id ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, bio, school_id: schoolId || null }).eq("id", profile.id);
    setSaving(false);
    if (error) { setError("Your profile could not be saved. Please try again."); return; }
    setSaved(true); router.refresh();
  }
  return <div><PageHeading eyebrow="Behind the byline" title="Your profile" description="Help readers get to know the person behind your stories." />
    <div className="nr-profile-grid"><section className="nr-panel nr-profile-summary"><div className="relative mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-brand/10 font-display text-3xl font-bold text-brand">{profile.avatar_url && !avatarFailed ? <Image src={profile.avatar_url} alt="" fill sizes="96px" className="object-cover" onError={() => setAvatarFailed(true)} /> : <span aria-hidden="true">{displayName.trim().charAt(0).toUpperCase() || "DB"}</span>}</div><h2 className="mb-3">{displayName || "Your name"}</h2><RoleBadge role={profile.role} /><p className="mt-4 text-sm leading-relaxed text-muted">{bio || "Add a short bio to introduce yourself to readers."}</p>{profile.username && <Link href={"/author/" + encodeURIComponent(profile.username)} className="nr-text-link mt-4">View public profile ↗</Link>}<p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">Roles are managed from the Admin workspace.</p></section>
    <form onSubmit={handleSave} className="nr-panel nr-profile-fields"><div><label htmlFor="profile-name">Display name</label><input id="profile-name" required autoComplete="name" value={displayName} onChange={e => { setDisplayName(e.target.value); setSaved(false); }} className="w-full border border-line bg-white px-4 py-3 text-sm" /></div><div><label htmlFor="profile-username">Username</label><input id="profile-username" value={profile.username ?? ""} placeholder="Not set" readOnly aria-describedby="username-note" className="w-full border border-line bg-surface px-4 py-3 text-sm" /><p id="username-note" className="mt-2 text-xs text-muted">Your existing public profile address. Usernames are read-only here.</p></div><div><SchoolSelect id="profile-school" value={schoolId} onChange={value => { setSchoolId(value); setSaved(false); }} schools={schools} /></div><div><label htmlFor="profile-bio">Bio</label><textarea id="profile-bio" rows={6} value={bio} onChange={e => { setBio(e.target.value); setSaved(false); }} className="w-full border border-line bg-white px-4 py-3 text-sm" /></div>{error && <p role="alert" className="mb-4 text-sm text-brand">{error}</p>}{saved && <p role="status" className="mb-4 text-sm text-accent">Profile saved.</p>}<button type="submit" disabled={saving} className="nr-button nr-button-primary disabled:opacity-50">{saving ? "Saving…" : "Save profile"}</button></form></div></div>;
}
