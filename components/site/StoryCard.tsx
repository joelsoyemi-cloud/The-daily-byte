'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type StoryCardPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  content_type: string;
  published_at: string | null;
  categories?: { name: string; slug: string } | null;
};

const SIZE_CLASSES = {
  lead: { aspect: 'aspect-[16/10]', title: 'text-2xl sm:text-3xl lg:text-4xl', pad: 'p-5 sm:p-6' },
  medium: { aspect: 'aspect-[4/3]', title: 'text-lg sm:text-xl', pad: 'p-4' },
  small: { aspect: 'aspect-[4/3]', title: 'text-base', pad: 'p-3.5' },
  rail: { aspect: 'aspect-[3/4]', title: 'text-base', pad: 'p-4' },
} as const;

export default function StoryCard({
  post,
  size = 'medium',
  priority = false,
}: {
  post: StoryCardPost;
  size?: keyof typeof SIZE_CLASSES;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const sizes = SIZE_CLASSES[size];
  const isVideo = post.content_type === 'video';

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="h-full flex flex-col rounded-3xl overflow-hidden bg-white shadow-soft hover:shadow-soft-lg transition-shadow duration-300">
        <div className={`relative ${sizes.aspect} overflow-hidden bg-surface`}>
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setLoaded(true)}
              className={`object-cover transition-all duration-500 ease-out group-hover:scale-[1.04] ${
                loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-display font-900 text-white/25 text-4xl select-none">
                {post.categories?.name?.[0] ?? 'B'}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2">
            {post.categories && (
              <span className="bg-brand text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                {post.categories.name}
              </span>
            )}
          </div>

          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-ink ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col ${sizes.pad}`}>
          <h3
            className={`font-display font-700 leading-tight ${sizes.title} transition-transform duration-300 group-hover:translate-x-0.5`}
          >
            {post.title}
          </h3>

          {size === 'lead' && post.excerpt && (
            <p className="text-muted mt-2 leading-relaxed line-clamp-2">{post.excerpt}</p>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between">
            <span className="text-xs text-muted font-medium">
              {post.published_at &&
                new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-brand transition-transform duration-300 group-hover:translate-x-1"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
}