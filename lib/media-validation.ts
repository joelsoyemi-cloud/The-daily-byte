const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);

/** Client-side validation is an early check, not a replacement for Storage policies. */
export function validateMediaFile(file: { type: string; size: number }): void {
  const image = IMAGE_TYPES.has(file.type);
  if (!image && !VIDEO_TYPES.has(file.type)) throw new Error("Choose a JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, Ogg, or MOV file.");
  const limit = (image ? 20 : 50) * 1024 * 1024;
  if (file.size <= 0 || file.size > limit) throw new Error(image ? "Images must be between 1 byte and 20 MB." : "Videos must be between 1 byte and 50 MB.");
}
