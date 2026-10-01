import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicStories, parsePage, publicUrl, type ListingSearchParams } from "@/lib/public-listings";
import StoryArchive from "@/components/site/StoryArchive";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 0;
type PublicProfile = { id: string; username: string; display_name: string; bio: string | null; avatar_url: string | null };
const getProfile = cache(async (username: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, username, display_name, bio, avatar_url").eq("username", username).returns<PublicProfile[]>().maybeSingle();
  if (error) throw new Error("Unable to load this author.");
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return {};
  const url = publicUrl(`/author/${encodeURIComponent(profile.username)}`);
  return { title: profile.display_name || profile.username, description: profile.bio || undefined, alternates: { canonical: url }, openGraph: { title: profile.display_name || profile.username, description: profile.bio || undefined, url, type: "profile", siteName: "The Daily Byte" } };
}

export default async function AuthorPage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: ListingSearchParams }) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();
  const page = parsePage((await searchParams).page);
  const listing = await getPublicStories({ page, authorId: profile.id });
  const initials = (profile.display_name || profile.username).trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("");
  const path = `/author/${encodeURIComponent(profile.username)}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6"><ol className="flex flex-wrap items-center gap-2 text-sm text-muted"><li><Link href="/" className="inline-flex min-h-11 items-center hover:text-brand">Home</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="[overflow-wrap:anywhere]">{profile.display_name || profile.username}</li></ol></nav>
      <Reveal><header className="mb-12 flex flex-col gap-6 rounded-3xl border border-line bg-surface p-6 shadow-soft sm:flex-row sm:items-start sm:p-10">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-brand/10 font-display text-3xl font-bold text-brand sm:h-28 sm:w-28">
          {profile.avatar_url ? <Image src={profile.avatar_url} alt="" fill sizes="(max-width: 639px) 96px, 112px" className="object-cover" /> : <span aria-hidden="true">{initials}</span>}
        </div>
        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Behind the stories</p>
          <h1 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{profile.display_name || profile.username}</h1>
          <p className="mt-2 text-sm text-muted">@{profile.username}</p>
          {profile.bio && <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted">{profile.bio}</p>}
        </div>
      </header></Reveal>
      <StoryArchive {...listing} page={page} path={path} empty="No public stories from this author yet." />
    </div>
  );
}
