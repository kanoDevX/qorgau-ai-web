import { cn } from "@/lib/utils";

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <defs>
          <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-trust-400)" />
            <stop offset="1" stopColor="var(--color-trust-700)" />
          </linearGradient>
        </defs>
        <path
          d="M16 2.5 27 7v9.2c0 7-4.6 11.6-11 13.3C9.6 27.8 5 23.2 5 16.2V7l11-4.5Z"
          fill="url(#qg)"
        />
        <path d="M11 16.4 14.6 20 21.5 12.4" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withWordmark && (
        <span className="text-[15px] font-bold tracking-tight text-[var(--text)]">
          Qorgau<span className="text-[var(--brand)]">AI</span>
        </span>
      )}
    </span>
  );
}
