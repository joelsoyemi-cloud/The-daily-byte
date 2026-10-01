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
  const [failedImage, setFailedImage] = useState(false);
  const sizes = SIZE_CLASSES[size];
  const isVideo = post.content_type === 'video';

  return (
    <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="group block h-full min-w-0 rounded-3xl [overflow-wrap:anywhere]">
      <article className="h-full min-w-0 flex flex-col rounded-3xl overflow-hidden bg-white shadow-soft hover:shadow-soft-lg motion-safe:transition-shadow motion-safe:duration-300">
        <div className={`relative ${sizes.aspect} overflow-hidden bg-surface`}>
          {post.cover_image && !failedImage ? (
            <Image
              src={post.cover_image}
              alt=""
              fill
              priority={priority}
              sizes={size === 'rail' ? '(max-width: 639px) 260px, 280px' : size === 'lead' ? '(max-width: 1023px) 100vw, 750px' : '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 370px'}
              onError={() => setFailedImage(true)}
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span aria-hidden="true" className="font-display font-black text-brand/40 text-4xl select-none">
                {post.categories?.name?.[0] ?? 'B'}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 right-3 flex gap-2">
            {post.categories && (
              <span className="bg-brand text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                {post.categories.name}
              </span>
            )}
          </div>

          {isVideo && (
            <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-ink ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col ${sizes.pad}`}>
          <h3
            className={`font-display font-bold leading-tight ${sizes.title} motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-0.5`}
          >
            {isVideo && <span className="sr-only">Video: </span>}
            {post.title}
          </h3>

          {size === 'lead' && post.excerpt && (
            <p className="text-muted mt-2 leading-relaxed line-clamp-2">{post.excerpt}</p>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between">
            <span className="text-xs text-muted font-medium">
              {post.published_at && !Number.isNaN(Date.parse(post.published_at)) &&
                <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}</time>}
            </span>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-brand motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
}
