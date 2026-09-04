import { createClient } from '@/lib/supabase/client';

/**
 * Compresses/resizes an image in the browser before upload, using canvas.
 * Keeps aspect ratio, caps the longest side at maxWidth, re-encodes as JPEG.
 */
export async function compressImage(
  file: File,
  { maxWidth = 1600, quality = 0.82 }: { maxWidth?: number; quality?: number } = {}
): Promise<File> {
  // Only compress actual images; pass anything else through untouched.
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}

/**
 * Uploads a file to the "media" Supabase Storage bucket and returns its
 * public URL. Images are compressed first; video/other files upload as-is.
 */
export async function uploadMedia(file: File): Promise<string> {
  const supabase = createClient();
  const toUpload = await compressImage(file);

  const safeName = toUpload.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const path = `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from('media').upload(path, toUpload, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Turns a YouTube or Vimeo watch/share URL into embeddable HTML.
 * Returns null if the URL isn't a recognized video link.
 */
export function videoUrlToEmbed(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (yt) {
    return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${yt[1]}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${vimeo[1]}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
  }

  return null;
}

/** Wraps an uploaded video file's URL in an HTML5 <video> tag. */
export function videoFileEmbed(url: string): string {
  return `<video controls src="${url}"></video>`;
}
