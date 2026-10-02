export type BrandVariant = "light" | "dark" | "mono";

/** Light/dark describe the surrounding surface; mono inherits its text color. */
export default function BrandLogo({ variant = "light", className = "" }: {
  variant?: BrandVariant;
  className?: string;
}) {
  return (
    <span role="img" aria-label="The Daily Byte" className={`inline-flex shrink-0 whitespace-nowrap font-brand font-bold leading-none tracking-[-0.045em] ${className}`}>
      <span aria-hidden="true" className={variant === "mono" ? "text-current" : variant === "dark" ? "text-white" : "text-ink"}>
        The Daily<span className={variant === "mono" ? "text-current" : "text-brand"}>{" "}Byte</span>
      </span>
    </span>
  );
}
