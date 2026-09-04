'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeletePostButton({
  postId,
  postTitle,
}: {
  postId: string;
  postTitle: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    if (!confirm(`Delete "${postTitle}"? This can't be undone.`)) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-muted hover:text-brand">
      Delete
    </button>
  );
}
