import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SCHOOL_SELECT, SCHOOL_TYPES, type School } from "@/lib/schools";
import { parsePage } from "@/lib/public-listings";
import { PageHeading, Panel, StatusBadge } from "@/components/dashboard/WorkspaceUI";
import { saveSchool } from "./actions";
export const dynamic = "force-dynamic";
const fields = [["name", "Name", 160], ["slug", "Slug", 180], ["short_name", "Short name", 40], ["city", "City", 100], ["state", "State", 100], ["country", "Country", 100]] as const;
export default async function AdminSchools({ searchParams }: { searchParams: Promise<{ page?: string; edit?: string; error?: string; saved?: string }> }) {
  await requireAdmin();
  const params = await searchParams, page = parsePage(params.page), supabase = await createClient();
  const { data, count, error } = await supabase.from("schools").select(SCHOOL_SELECT, { count: "exact" }).order("name").order("id").range((page - 1) * 20, page * 20 - 1).returns<School[]>();
  if (error) throw new Error("Unable to load schools.");
  let selected: School | null = null;
  if (params.edit && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.edit)) {
    const result = await supabase.from("schools").select(SCHOOL_SELECT).eq("id", params.edit).returns<School[]>().maybeSingle();
    if (result.error) throw new Error("Unable to load this school.");
    selected = result.data;
  }
  return <div><PageHeading eyebrow="Campus network" title="Schools & universities" description="Manage real institutions. Listing a school does not imply partnership or endorsement." />
    {params.error && <p role="alert" className="mb-5 text-brand">The school could not be saved. Check the fields and use a unique slug for a new school.</p>}
    {params.saved === "1" && <p role="status" className="mb-5 text-accent">School saved.</p>}
    <Panel title={selected ? "Edit school" : "Add a school"} description="Deactivate a school to hide its campus page and remove it from new selections. Existing associations are retained.">
      <form key={selected?.id ?? "new"} action={saveSchool} className="space-y-5 p-6">
        <input type="hidden" name="id" value={selected?.id ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(([name, label, max]) => { const value = selected?.[name] ?? ""; return <div className="min-w-0" key={name}><label htmlFor={"school-" + name} className="mb-2 block text-sm font-semibold">{label}</label><input id={"school-" + name} name={name} defaultValue={value ?? ""} required={name === "name" || name === "slug"} readOnly={name === "slug" && !!selected} maxLength={Number(max)} pattern={name === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined} className="w-full border border-line px-3 py-2" /></div>; })}</div>
        <p className="text-xs text-muted">Slugs stay fixed after creation to preserve campus URLs. Location and short name are optional; enter only known details.</p>
        <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="school-type" className="mb-2 block text-sm font-semibold">Institution type</label><select id="school-type" name="type" defaultValue={selected?.type ?? "university"} className="w-full border border-line px-3 py-2">{SCHOOL_TYPES.map(t => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}</select></div><div><label htmlFor="school-status" className="mb-2 block text-sm font-semibold">Status</label><select id="school-status" name="status" defaultValue={selected?.status ?? "active"} className="w-full border border-line px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
        <div><label htmlFor="school-description" className="mb-2 block text-sm font-semibold">Description (optional)</label><textarea id="school-description" name="description" maxLength={2000} rows={4} defaultValue={selected?.description ?? ""} className="w-full border border-line px-3 py-2" /></div>
        <div className="flex flex-wrap gap-3"><button className="nr-button nr-button-primary" type="submit">{selected ? "Save school" : "Add school"}</button>{selected && <Link href="/admin/schools" className="nr-button nr-button-secondary">Cancel editing</Link>}</div>
      </form>
    </Panel>
    <Panel title="Institutions"><ul>{data?.map(s => <li key={s.id} className="nr-story-row"><div className="min-w-0"><h3 className="font-semibold">{s.name}</h3><StatusBadge status={s.status} /></div><Link className="nr-button nr-button-secondary" href={"/admin/schools?edit=" + s.id}>Edit <span className="sr-only">{s.name}</span></Link></li>)}</ul>{!data?.length && <p className="p-6">No schools on this page.</p>}</Panel>
    <nav aria-label="School management pagination" className="flex flex-wrap items-center gap-4"><span>Page {page}</span>{page > 1 && <Link className="nr-button nr-button-secondary" href={"/admin/schools?page=" + (page - 1)}>Previous</Link>}{page * 20 < (count ?? 0) && <Link className="nr-button nr-button-secondary" href={"/admin/schools?page=" + (page + 1)}>Next</Link>}</nav>
  </div>;
}
