import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Қошқар мүйіз (ram's horn): the most common motif in Kazakh ornament, read as protection of
 * the home. Own drawing (docs/LICENSES.md). Two mirrored horn spirals meet on a central stem; the
 * tile repeats as a band.
 *
 * Quiet by design: drawn in --ornament / --ornament-gold, which are pre-mixed into the background
 * colour, so it never lowers text contrast and needs no opacity tricks. Always decorative (aria-hidden).
 */
export function Ornament({
  className,
  tone = "azure",
  size = 56,
}: {
  className?: string;
  tone?: "azure" | "gold";
  size?: number;
}) {
  const id = useId().replace(/:/g, "");
  const stroke = tone === "gold" ? "var(--ornament-gold)" : "var(--ornament)";
  return (
    <svg className={cn("pointer-events-none block w-full", className)} aria-hidden focusable="false" height={size}>
      <defs>
        <pattern id={`qm-${id}`} width={size * 2} height={size} patternUnits="userSpaceOnUse" viewBox="0 0 112 56">
          <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {/* central stem */}
            <path d="M56 50V26" />
            {/* left horn: rises from the stem and curls inward */}
            <path d="M56 26c0-12-8-20-18-20S22 13 22 22s6 13 12 13 9-4 9-8-3-6-6-6" />
            {/* right horn, mirrored */}
            <path d="M56 26c0-12 8-20 18-20s16 7 16 16-6 13-12 13-9-4-9-8 3-6 6-6" />
            {/* small base curls joining the next tile */}
            <path d="M56 50c-6 0-10-4-10-9M56 50c6 0 10-4 10-9" />
            <path d="M0 50h10M102 50h10" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#qm-${id})`} />
    </svg>
  );
}
