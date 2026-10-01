export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_image: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_id: string | null;
  school_id: string | null;
  category_id: string | null;
  status: string;
  content_type: string;
  featured: boolean;
  breaking: boolean;
  scheduled_at: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
};

/** Projection used by the public article page, including nullable joins. */
export type ArticlePost = Pick<
  Post,
  | "id" | "title" | "slug" | "excerpt" | "content" | "category"
  | "cover_image" | "published_at" | "updated_at" | "author_id"
  | "category_id" | "seo_title" | "seo_description"
> & {
  schools: { name: string; slug: string; status: string } | null;
  tags: string[] | null;
  categories: { name: string; slug: string } | null;
  profiles: {
    id: string;
    username: string | null;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    role: string;
  } | null;
};

export const CATEGORIES = [
  "General",
  "Entertainment",
  "Music",
  "Tech",
  "Business",
  "Lifestyle",
  "Sports",
  "Politics",
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
