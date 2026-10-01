"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/posts";

type Category = { id: string; name: string; slug: string };

export default function CategoriesManager({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("categories")
      .insert({ name, slug: slugify(name) });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this category? Articles using it will keep their old text category but lose the link.",
      )
    )
      return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-6">
        <input
          aria-label="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border-2 border-line focus:border-ink px-3 py-2 bg-white text-sm"
        />
        <button
          type="submit"
          disabled={saving || !name}
          className="bg-ink text-white px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-brand transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {error && <p role="alert" className="text-brand text-sm font-medium mb-4">{error}</p>}

      <ul className="divide-y divide-line rounded-2xl border border-line bg-white px-5">
        {categories.map((c) => (
          <li key={c.id} className="py-3 flex items-center justify-between gap-4">
            <span className="font-medium">{c.name}</span>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-xs font-bold uppercase tracking-wide text-brand hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
