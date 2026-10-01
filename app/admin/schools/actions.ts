"use server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SCHOOL_TYPES } from "@/lib/schools";
export async function saveSchool(form: FormData) {
  await requireAdmin();
  const field = (name: string) => { const value = form.get(name); return typeof value === "string" ? value.trim() : ""; };
  const id = field("id"), name = field("name"), slug = field("slug"), type = field("type"), status = field("status");
  const optional = { short_name: field("short_name") || null, city: field("city") || null, state: field("state") || null, country: field("country") || null, description: field("description") || null };
  const invalid = !name || name.length > 160 || (!id && (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 180)) || !SCHOOL_TYPES.some(t => t === type) || !["active", "inactive"].includes(status) || (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) || (optional.short_name?.length ?? 0) > 40 || [optional.city, optional.state, optional.country].some(v => (v?.length ?? 0) > 100) || (optional.description?.length ?? 0) > 2000;
  if (invalid) redirect("/admin/schools?error=invalid");
  const supabase = await createClient();
  const values = { name, type, status, ...optional };
  const result = id ? await supabase.from("schools").update(values).eq("id", id).select("slug").single() : await supabase.from("schools").insert({ ...values, slug }).select("slug").single();
  if (result.error) redirect("/admin/schools?error=save");
  revalidatePath("/schools", "layout");
  revalidatePath("/admin/schools");
  revalidatePath("/sitemap.xml");
  redirect("/admin/schools?saved=1");
}
