"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateDraftButton({
  title,
  link,
  category,
}: {
  title: string;
  link: string;
  category: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, link, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate draft.");
      router.push(`/admin/edit/${data.id}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <span>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-accent hover:underline disabled:opacity-50"
      >
        {loading ? "Generating…" : "AI draft →"}
      </button>
      {error && <span className="text-brand ml-2">{error}</span>}
    </span>
  );
}
