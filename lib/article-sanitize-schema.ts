import { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";

export const articleSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "iframe", "video"],
  attributes: {
    ...defaultSchema.attributes,
    iframe: ["src", "allow", "allowFullScreen", "frameBorder"],
    video: ["src", "controls"],
  },
};
