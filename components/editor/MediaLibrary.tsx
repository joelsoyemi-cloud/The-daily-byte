"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/dashboard/EmptyState";

type FileEntry = {
  name: string;
  created_at: string;
  metadata: { size?: number } | null;
};

export default function MediaLibrary() {
  const supabase = createClient();
  const [files, setFiles] = useState<FileEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.storage.from("media").list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      setError(error.message);
      return;
    }
    setFiles((data as FileEntry[]) ?? []);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function handleDelete(name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    const { error } = await supabase.storage.from("media").remove([name]);
    if (error) {
      alert(error.message);
      return;
    }
    load();
  }

  if (error) return <p className="text-brand text-sm">{error}</p>;
  if (files === null) return <p className="text-muted text-sm">Loading…</p>;
  if (files.length === 0)
    return <EmptyState message="No media uploaded yet." />;

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {files.map((f) => {
        const url = supabase.storage.from("media").getPublicUrl(f.name)
          .data.publicUrl;
        const isVideo = /\.(mp4|webm|mov)$/i.test(f.name);
        return (
          <li key={f.name} className="rounded-2xl border border-line bg-white p-3 shadow-soft">
            {isVideo ? (
              <div className="w-full aspect-square bg-ink flex items-center justify-center text-white text-xs">
                Video
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                className="w-full aspect-square rounded-xl object-cover"
              />
            )}
            <p className="mt-3 text-xs text-muted [overflow-wrap:anywhere]">{f.name}</p>
            <button
              aria-label={"Delete " + f.name}
              onClick={() => handleDelete(f.name)}
              className="mt-2 text-[11px] font-bold uppercase tracking-wide text-brand hover:underline w-full text-left"
            >
              Delete
            </button>
          </li>
        );
      })}
    </ul>
  );
}
