import { requireEditor } from "@/lib/auth";
import MediaLibrary from "@/components/editor/MediaLibrary";

export default async function MediaPage() {
  await requireEditor();

  return (
    <div className="nr-legacy">
      <h1 className="font-display font-bold text-2xl mb-6">Media</h1>
      <MediaLibrary />
    </div>
  );
}
