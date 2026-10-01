import type { BrandVariant } from "./BrandLogo";

/** Geometric DB with a detached red pixel; no font dependency at icon sizes. */
export default function BrandMark({ variant = "light", className = "", decorative = false }: {
  variant?: BrandVariant;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" focusable="false"
      role={decorative ? undefined : "img"} aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "The Daily Byte"}
      className={`shrink-0 ${variant === "mono" ? "text-current" : variant === "dark" ? "text-white" : "text-ink"} ${className}`}>
      <path fill="currentColor" fillRule="evenodd" d="M3 6h7l4 4v12l-4 4H3V6Zm4 4v12h2l1-1V11l-1-1H7Zm10-4h7l4 4v4l-2 2 2 2v4l-4 4h-7V6Zm4 4v4h2l1-1v-2l-1-1h-2Zm0 8v4h2l1-1v-2l-1-1h-2Z" />
      <path fill={variant === "mono" ? "currentColor" : "#D6293B"} d="M26 1h4v4h-4z" />
    </svg>
  );
}
