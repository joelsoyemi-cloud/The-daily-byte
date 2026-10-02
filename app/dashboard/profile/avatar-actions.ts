"use server";
import { requireContributor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { replaceOwnAvatar, type AvatarResult } from "@/lib/avatar-storage";
import { revalidatePath } from "next/cache";
export async function uploadAvatar(form: FormData): Promise<AvatarResult> {
  const profile = await requireContributor();
  const file = form.get("avatar");
  if (!file || typeof file === "string" || !(file instanceof Blob)) return { ok: false, message: "Choose a profile picture first." };
  try {
    const result = await replaceOwnAvatar(await createClient(), profile, file, process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (result.ok) {
      revalidatePath("/dashboard", "layout"); revalidatePath("/editor", "layout"); revalidatePath("/admin", "layout");
      if (profile.username) revalidatePath("/author/" + encodeURIComponent(profile.username));
      revalidatePath("/blog", "layout");
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { ok: false, message: /^(Choose|This file)/.test(message) ? message : "Your picture could not be updated. Check your connection and try again." };
  }
}
