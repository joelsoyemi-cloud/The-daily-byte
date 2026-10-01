import Link from "next/link";
export default function EmptyState({ message, actionLabel, actionHref }: { message: string; actionLabel?: string; actionHref?: string }) {
  return <div className="nr-empty"><p>{message}</p>{actionLabel && actionHref && <Link href={actionHref} className="nr-button nr-button-primary">{actionLabel}</Link>}</div>;
}
