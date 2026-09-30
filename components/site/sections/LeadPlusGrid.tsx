import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";
import { StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

export default function LeadPlusGrid({ posts }: { posts: StoryCardPost[] }) {
  const [lead, ...rest] = posts;
  if (!lead) return null;

  return (
    <StaggerReveal className="grid lg:grid-cols-3 gap-5">
      <StaggerItem className="lg:col-span-2">
        <StoryCard post={lead} size="lead" />
      </StaggerItem>
      {rest.length > 0 && (
        <StaggerItem className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          {rest.slice(0, 4).map((post) => (
            <StoryCard key={post.slug} post={post} size="small" />
          ))}
        </StaggerItem>
      )}
    </StaggerReveal>
  );
}
