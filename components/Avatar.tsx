"use client";
import Image from "next/image";
import { useState } from "react";
import { avatarInitials } from "@/lib/avatar";
export default function Avatar({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  let safeUrl: string | null = null;
  try {
    if (url) {
      const image = new URL(url), host = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
      if (image.protocol === "https:" && !image.username && !image.password && (image.hostname === host || image.hostname === "images.unsplash.com")) safeUrl = url;
    }
  } catch { /* Use initials for missing or invalid images. */ }
  return <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand/10 font-display font-bold text-brand" style={{ width: size, height: size }} aria-hidden="true">{safeUrl && failedUrl !== safeUrl ? <Image src={safeUrl} alt="" fill sizes={size + "px"} className="object-cover" onError={() => setFailedUrl(safeUrl)} /> : avatarInitials(name)}</span>;
}
