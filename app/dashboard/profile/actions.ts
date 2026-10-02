"use server";
import { requireContributor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
export async function saveOwnProfile(input: { display_name: string; bio: string; school_id: string; username: string }) {
  const profile = await requireContributor();
  if (!input || Object.values(input).some(value => typeof value !== "string")) return { ok: false, message: "Please check your profile fields." };
  const name = input.display_name?.trim(), bio = input.bio?.trim(), school = input.school_id, username = input.username?.trim().toLowerCase();
  if (!name || name.length > 160 || bio === undefined || bio.length > 2000 || typeof school !== "string" || (school && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(school)) || (!profile.username && (!username || username.length < 3 || username.length > 40 || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(username)))) return { ok: false, message: "Use a name up to 160 characters, bio up to 2,000 characters, and a username of 3–40 lowercase letters, numbers, hyphens, or underscores." };
  try {
    const supabase = await createClient();
    let query = supabase.from("profiles").update({ display_name: name, bio, school_id: school || null, ...(!profile.username ? { username } : {}) }).eq("id", profile.id);
    if (!profile.username) query = query.is("username", null);
    const { data, error } = await query.select("id").maybeSingle();
    if (error || !data) return { ok: false, message: error?.code === "23505" ? "That username is already in use. Choose another." : error?.code === "23514" ? "Your selected school is unavailable. Choose another school or leave it empty." : "Your profile could not be saved. Refresh and try again." };
    revalidatePath("/dashboard", "layout");
    revalidatePath("/author/" + encodeURIComponent(profile.username || username));
    return { ok: true, message: "Profile saved." };
  } catch { return { ok: false, message: "Your profile could not be saved. Check your connection and try again." }; }
}
