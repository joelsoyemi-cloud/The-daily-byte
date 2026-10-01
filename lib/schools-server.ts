import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { SCHOOL_SELECT, type School, type SchoolOption } from "./schools";
export const getSchool = cache(async (slug: string) => {
  const { data, error } = await createPublicClient().from("schools").select(SCHOOL_SELECT).eq("slug", slug).eq("status", "active").returns<School[]>().maybeSingle();
  if (error) throw new Error("Unable to load this school.");
  return data;
});
export async function getSchoolOptions(): Promise<SchoolOption[]> {
  const client = createPublicClient();
  const options: SchoolOption[] = [];
  for (let start = 0; start < 10000; start += 500) {
    const { data, error } = await client.from("schools").select("id, name").eq("status", "active").order("name").order("id").range(start, start + 499).returns<SchoolOption[]>();
    if (error) throw new Error("Unable to load school choices.");
    options.push(...(data ?? []));
    if (!data || data.length < 500) return options;
  }
  throw new Error("School selector capacity exceeded.");
}
