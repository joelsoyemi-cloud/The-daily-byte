import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";

const ALLOWED_IFRAME_HOSTS = [
  /^https:\/\/www\.youtube\.com\/embed\//,
  /^https:\/\/player\.vimeo\.com\/video\//,
];
const ALLOWED_VIDEO_SRC =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/media\//i;

export function rehypeRestrictEmbeds() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "iframe" && node.tagName !== "video") return;

      const src = node.properties?.src;
      const patterns =
        node.tagName === "iframe" ? ALLOWED_IFRAME_HOSTS : [ALLOWED_VIDEO_SRC];
      const isAllowed =
        typeof src === "string" && patterns.some((p) => p.test(src));

      if (!isAllowed && parent && typeof index === "number") {
        parent.children.splice(index, 1);
        // Revisit this index: the next sibling shifted into the removed slot.
        return index;
      }
    });
  };
}
