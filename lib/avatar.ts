export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export function validateAvatar(file: { type: string; size: number }, bytes?: Uint8Array) {
  if (!AVATAR_TYPES.some(type => type === file.type)) throw new Error("Choose a JPEG, PNG, or WebP profile picture.");
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) throw new Error("Choose a profile picture smaller than 2 MB.");
  if (bytes) {
    const matches = file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : file.type === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
        : [82, 73, 70, 70].every((byte, index) => bytes[index] === byte) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
    if (!matches) throw new Error("This file is not a valid JPEG, PNG, or WebP image. Choose another picture.");
  }
}
export function ownedAvatarPath(url: string | null, userId: string, storageUrl: string): string | null {
  if (!url) return null;
  try {
    const value = new URL(url), base = new URL(storageUrl), prefix = "/storage/v1/object/public/avatars/";
    if (value.origin !== base.origin || value.search || value.hash || !value.pathname.startsWith(prefix)) return null;
    const path = value.pathname.slice(prefix.length);
    return path.startsWith(userId + "/") && /^[0-9a-f-]+\/[0-9a-f-]+\.(jpg|png|webp)$/i.test(path) ? path : null;
  } catch { return null; }
}
export function avatarInitials(name: string) { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join("").toUpperCase() || "DB"; }
