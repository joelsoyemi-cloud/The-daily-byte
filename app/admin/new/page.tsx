import PostForm from "@/components/PostForm";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{
    title?: string;
    category?: string;
    slug?: string;
    source?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <PostForm
      prefill={
        params.title
          ? {
              title: params.title,
              category: params.category,
              slug: params.slug,
              sourceUrl: params.source,
            }
          : undefined
      }
    />
  );
}
 