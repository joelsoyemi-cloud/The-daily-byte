import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchool } from "@/lib/schools-server";
import { createPublicClient } from "@/lib/supabase/public";
import { publicPageMetadata } from "@/lib/site";
import { getPublicStories, parsePage, type ListingSearchParams } from "@/lib/public-listings";
import StoryArchive from "@/components/site/StoryArchive";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: ListingSearchParams };
export async function generateMetadata({ params, searchParams }: Props) {
  const school = await getSchool((await params).slug);
  if (!school) return {};
  return publicPageMetadata({ title: school.name + " campus stories", description: school.description || "Stories and perspectives connected to " + school.name + " on The Daily Byte.", path: "/schools/" + encodeURIComponent(school.slug), page: parsePage((await searchParams).page) });
}
export default async function SchoolPage({ params, searchParams }: Props) {
  const school = await getSchool((await params).slug);
  if (!school) notFound();
  const page = parsePage((await searchParams).page);
  const [listing, contributors] = await Promise.all([
    getPublicStories({ page, schoolId: school.id }),
    createPublicClient().from("profiles").select("id, username, display_name").eq("school_id", school.id).eq("status", "active").in("role", ["contributor", "author", "editor", "admin"]).not("username", "is", null).order("display_name").order("id").limit(12).returns<{ id: string; username: string | null; display_name: string }[]>(),
  ]);
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 [overflow-wrap:anywhere]">
    <nav aria-label="Breadcrumb" className="mb-6"><Link href="/schools" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-brand">Campus network</Link></nav>
    <header className="mb-10 rounded-3xl border border-line bg-surface p-6 sm:p-10"><p className="text-sm font-bold text-brand">{school.short_name || "Campus stories"}</p><h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">{school.name}</h1>{school.description && <p className="mt-5 max-w-3xl whitespace-pre-line leading-relaxed text-muted">{school.description}</p>}<p className="mt-4 text-xs leading-relaxed text-muted">Community stories and self-selected affiliations. No official endorsement or partnership is implied.</p></header>
    <StoryArchive {...listing} page={page} path={"/schools/" + encodeURIComponent(school.slug)} empty="No public campus stories yet. Check back as the community grows." />
    <section className="mt-12"><h2 className="font-display text-2xl font-bold">Community contributors</h2><p className="mt-2 text-sm text-muted">Writers who have chosen this school on their profiles.</p>{contributors.error ? <p className="mt-4 text-sm text-muted">Contributors are temporarily unavailable.</p> : contributors.data?.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{contributors.data.filter(p => p.username).map(p => <li key={p.id} className="min-w-0"><Link href={"/author/" + encodeURIComponent(p.username!)} className="flex min-h-11 items-center rounded-xl border border-line p-4 font-semibold hover:text-brand">{p.display_name || p.username}</Link></li>)}</ul> : <p className="mt-4 text-sm text-muted">No public contributor profiles to show yet.</p>}</section>
  </div>;
}
