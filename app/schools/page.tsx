import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { publicPageMetadata } from "@/lib/site";
import { parsePage, type ListingSearchParams } from "@/lib/public-listings";
import type { School } from "@/lib/schools";
export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }: { searchParams: ListingSearchParams }) {
  return publicPageMetadata({ title: "Campus network", description: "Discover campus stories and writers across The Daily Byte.", path: "/schools", page: parsePage((await searchParams).page) });
}
export default async function SchoolsPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const page = parsePage((await searchParams).page);
  const { data, count, error } = await createPublicClient().from("schools").select("id, name, slug, short_name, description", { count: "exact" }).eq("status", "active").order("name").order("id").range((page - 1) * 24, page * 24 - 1).returns<Pick<School, "id" | "name" | "slug" | "short_name" | "description">[]>();
  if (error) throw new Error("Unable to load the campus network.");
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 [overflow-wrap:anywhere]"><header className="mb-8"><p className="text-sm font-semibold text-brand">The Daily Byte</p><h1 className="mt-2 font-display text-4xl font-bold">Campus network</h1><p className="mt-4 max-w-2xl text-muted">Discover stories and writers connected to schools and universities. These are community associations, not institutional endorsements.</p></header>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.map(school => <article key={school.id} className="min-w-0 rounded-3xl border border-line bg-white p-6 shadow-soft"><p className="text-xs font-bold text-brand">{school.short_name}</p><h2 className="mt-2 font-display text-xl font-bold"><Link href={"/schools/" + encodeURIComponent(school.slug)} className="inline-flex min-h-11 items-center hover:text-brand">{school.name}</Link></h2>{school.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{school.description}</p>}</article>)}</div>
    {!data?.length && <p className="rounded-3xl border border-line p-8">No schools to show on this page.</p>}
    <nav aria-label="School pagination" className="mt-8 flex flex-wrap items-center gap-5"><span>Page {page}</span>{page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={"/schools?page=" + (page - 1)}>Previous</Link>}{page * 24 < (count ?? 0) && <Link className="inline-flex min-h-11 items-center underline" href={"/schools?page=" + (page + 1)}>Next</Link>}</nav>
  </div>;
}
