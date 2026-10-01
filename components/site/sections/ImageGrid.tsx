import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";
import { StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

export default function ImageGrid({ posts }: { posts: StoryCardPost[] }) {
  return (
    <StaggerReveal
      className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
      staggerDelay={0.05}
    >
      {posts.map((post, i) => (
        <StaggerItem
          key={post.slug}
          className={i === 0 ? "min-w-0 sm:col-span-2 sm:row-span-2" : "min-w-0"}
        >
          <StoryCard post={post} size={i === 0 ? "lead" : "medium"} />
        </StaggerItem>
      ))}
    </StaggerReveal>
  );
}
