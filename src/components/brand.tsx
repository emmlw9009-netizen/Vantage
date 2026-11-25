import { BRAND } from "@/lib/brand";
import { MONOGRAM_ENGRAVED_D, MONOGRAM_SOLID_D } from "@/lib/brand-mark";
import { cn } from "@/lib/format";

/**
 * The Vantage monogram: a high-contrast V that is also Nova's check mark (docs/design/brand.md).
 * Solid below 64px; the engraved version (five grooves, one per pre-flight check) at display sizes.
 * Server-safe (no hooks), colour from currentColor.
 */
export function Monogram({ size = 28, engraved = false, className, title }: { size?: number; engraved?: boolean; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={cn("shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path fill="currentColor" fillRule="evenodd" d={engraved ? MONOGRAM_ENGRAVED_D : MONOGRAM_SOLID_D} />
    </svg>
  );
}

/** Horizontal lockup set live in Archivo (same width, weight and tracking as the wordmark file). */
export function BrandLockup({ size = "md", className, compactBelow360 = false }: { size?: "sm" | "md" | "lg"; className?: string; compactBelow360?: boolean }) {
  const z = { sm: { mark: 24, text: "text-[18px]" }, md: { mark: 28, text: "text-[19px] lg:text-[21px]" }, lg: { mark: 40, text: "text-[28px]" } }[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Monogram size={z.mark} className="-my-1" />
      <span className={cn("leading-none font-[560] tracking-[0.012em] [font-stretch:125%]", z.text, compactBelow360 && "max-[359px]:sr-only")}>{BRAND.name}</span>
    </span>
  );
}
