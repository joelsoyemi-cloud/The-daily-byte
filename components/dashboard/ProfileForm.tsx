"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Profile</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
            Role
          </label>
          <p className="text-sm bg-surface border-2 border-line px-3 py-2 capitalize">
            {profile.role}
          </p>
          <p className="text-xs text-muted mt-1">
            Only an admin can change your role.
          </p>
        </div>

        {error && <p className="text-brand text-sm font-medium">{error}</p>}
        {saved && <p className="text-accent text-sm font-medium">Saved.</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-ink text-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-brand transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
