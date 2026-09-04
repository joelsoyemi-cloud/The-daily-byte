import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { type Post } from '@/lib/posts';
import PostForm from '@/components/PostForm';

export const revalidate = 0;

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (!post) notFound();

  return <PostForm post={post as Post} />;
}
