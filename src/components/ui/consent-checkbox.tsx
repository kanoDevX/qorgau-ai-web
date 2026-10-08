import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The one consent control used by every form that collects personal data (§3.6).
 * It is controlled and starts unchecked — callers must not pre-tick it. The privacy policy is linked
 * (opens in a new tab so the half-filled form is not lost).
 */
export function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  linkHref,
  linkLabel,
  invalid,
  error,
  className,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  linkHref: string;
  linkLabel: string;
  invalid?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-[var(--brand-solid)]"
        />
        <label htmlFor={id} className="text-sm leading-snug text-[var(--text-muted)]">
          {label}{" "}
          <Link
            href={linkHref}
            target="_blank"
            className={cn("text-[var(--brand)] underline underline-offset-2")}
          >
            {linkLabel}
          </Link>
        </label>
      </div>
      {invalid && error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-[var(--risk-danger-fg)]">
          {error}
        </p>
      )}
    </div>
  );
}
