import type { SupabaseClient } from "@supabase/supabase-js";
import { AVATAR_BUCKET, ownedAvatarPath, validateAvatar } from "./avatar";
export type AvatarResult = { ok: boolean; url?: string; message: string };
export async function replaceOwnAvatar(supabase: SupabaseClient, profile: { id: string; avatar_url: string | null }, file: File, storageUrl: string): Promise<AvatarResult> {
  validateAvatar(file, new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = profile.id + "/" + crypto.randomUUID() + "." + extension;
  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const { error: uploadError } = await bucket.upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (uploadError) return { ok: false, message: "Your picture could not be uploaded. Check your connection and try again." };
  const url = bucket.getPublicUrl(path).data.publicUrl;
  let discardUpload = false;
  try {
    let query = supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    query = profile.avatar_url !== null ? query.eq("avatar_url", profile.avatar_url) : query.is("avatar_url", null);
    const { data, error } = await query.select("id").maybeSingle();
    if (error || !data) {
      // A successful empty response means the compare-and-set lost its race.
      // These PostgreSQL errors also prove the transaction was rejected.
      // Network/server failures may arrive after commit: retain that object.
      discardUpload = !error || ["23503", "23505", "23514", "42501"].includes(error.code);
      return { ok: false, message: discardUpload ? "Your picture could not be saved, or your profile changed in another tab. Refresh and try again." : "We could not confirm whether your picture saved. Refresh your profile before trying again." };
    }
    const oldPath = ownedAvatarPath(profile.avatar_url, profile.id, storageUrl);
    if (oldPath) {
      try { const { error } = await bucket.remove([oldPath]); if (error) return { ok: true, url, message: "Picture updated. The old image could not be removed; please report this if it persists." }; }
      catch { return { ok: true, url, message: "Picture updated. The old image could not be removed; please report this if it persists." }; }
    }
    return { ok: true, url, message: "Profile picture updated." };
  } catch {
    return { ok: false, message: "We could not confirm whether your picture saved. Refresh your profile before trying again." };
  } finally {
    if (discardUpload) { try { await bucket.remove([path]); } catch { /* Preserve the old avatar if cleanup is unavailable. */ } }
  }
}
