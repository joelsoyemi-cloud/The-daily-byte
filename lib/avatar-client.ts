import { validateAvatar } from "./avatar";
/** Re-encode locally to strip metadata and keep uploads small. No cropping. */
export async function prepareAvatar(file: File): Promise<File> {
  validateAvatar(file, new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This picture could not be opened. Choose another JPEG, PNG, or WebP image."); }
  try {
    if (bitmap.width * bitmap.height > 25_000_000) throw new Error("Choose a smaller picture, up to 25 megapixels.");
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable. Try another browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || !["image/webp", "image/png"].includes(blob.type)) throw new Error("Image processing failed. Try another picture.");
    const image = new File([blob], "avatar." + (blob.type === "image/webp" ? "webp" : "png"), { type: blob.type });
    validateAvatar(image);
    return image;
  } finally { bitmap.close(); }
}
