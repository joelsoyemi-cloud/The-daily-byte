import Link from "next/link";

export default function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="border-2 border-dashed border-line rounded px-6 py-10 text-center">
      <p className="text-muted text-sm mb-4">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block bg-ink text-white px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-brand transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
