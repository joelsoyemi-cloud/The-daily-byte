import { requireEditor } from "@/lib/auth";
import MediaLibrary from "@/components/editor/MediaLibrary";

export default async function MediaPage() {
  await requireEditor();

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="font-display font-900 text-2xl mb-6">Media</h1>
      <MediaLibrary />
    </div>
  );
}
