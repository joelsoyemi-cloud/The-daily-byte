import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { articleSanitizeSchema } from "@/lib/article-sanitize-schema";
import { rehypeRestrictEmbeds } from "@/lib/rehype-restrict-embeds";

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        remarkRehypeOptions={{ allowDangerousHtml: true }}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, articleSanitizeSchema],
          rehypeRestrictEmbeds,
          rehypeHighlight,
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
