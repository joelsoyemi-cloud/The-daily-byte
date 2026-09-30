import StoryCard, { type StoryCardPost } from "@/components/site/StoryCard";
import { StaggerReveal, StaggerItem } from "@/components/motion/Reveal";

export default function ImageGrid({ posts }: { posts: StoryCardPost[] }) {
  return (
    <StaggerReveal
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
      staggerDelay={0.05}
    >
      {posts.map((post, i) => (
        <StaggerItem
          key={post.slug}
          className={i === 0 ? "col-span-2 row-span-2" : ""}
        >
          <StoryCard post={post} size={i === 0 ? "lead" : "medium"} />
        </StaggerItem>
      ))}
    </StaggerReveal>
  );
}
