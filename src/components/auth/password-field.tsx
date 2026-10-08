"use client";

import { useTranslations } from "next-intl";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/primitives";
import { PASSWORD_MIN, passwordRules, passwordStrength, type Strength } from "@/lib/password";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  /** Shows the strength meter and the rule checklist (sign-up, reset, change). */
  showStrength?: boolean;
  email?: string | null;
  error?: string | null;
  required?: boolean;
};

const BAR: Record<Strength, { width: string; color: string }> = {
  weak: { width: "25%", color: "var(--risk-danger)" },
  fair: { width: "50%", color: "var(--risk-caution)" },
  good: { width: "75%", color: "var(--brand-solid)" },
  strong: { width: "100%", color: "var(--risk-safe)" },
};

/**
 * Password input with show/hide (people mistype on phones — hiding is optional, not forced), a Caps Lock warning,
 * and for new passwords a strength meter plus the three rules the server enforces, ticked as they're met.
 */
export function PasswordField({ id, label, value, onChange, autoComplete, showStrength, email, error, required }: Props) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  const hintId = useId();
  const rules = passwordRules(value, email);
  const strength = passwordStrength(value, email);
  const described = [error ? `${id}-error` : null, caps ? `${id}-caps` : null, showStrength ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">
        {label}
      </label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          maxLength={128}
          required={required}
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}
          onKeyDown={(e) => setCaps(e.getModifierState("CapsLock"))}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hide") : t("show")}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {caps && (
        <p id={`${id}-caps`} className="mt-1 text-xs text-[var(--risk-caution-fg)]">
          {t("capsLock")}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-[var(--risk-danger-fg)]">
          {error}
        </p>
      )}
      {showStrength && (
        <div id={hintId} className="mt-2 space-y-2" data-testid="password-strength">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]" aria-hidden>
            <div className="h-full rounded-full transition-[width]" style={{ width: value ? BAR[strength].width : "0%", background: BAR[strength].color }} />
          </div>
          {value && <p className="text-xs text-[var(--text-muted)]">{t("strength", { level: t(`level.${strength}`) })}</p>}
          <ul className="space-y-0.5 text-xs">
            {(
              [
                ["length", rules.length, t("rule.length", { min: PASSWORD_MIN })],
                ["notCommon", rules.notCommon, t("rule.notCommon")],
                ["notEmail", rules.notEmail, t("rule.notEmail")],
              ] as const
            ).map(([key, ok, text]) => (
              <li key={key} className={cn("flex items-center gap-1.5", value && ok ? "text-[var(--risk-safe-fg)]" : "text-[var(--text-muted)]")}>
                {value && ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                <span>{text}</span>
                <span className="sr-only">{value && ok ? "✓" : "✗"}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--text-subtle)]">{t("hint")}</p>
        </div>
      )}
    </div>
  );
}

/** Maps an API problem code ("password.common") to a friendly, translated message. */
export function passwordErrorMessage(t: ReturnType<typeof useTranslations<"auth">>, code?: string | null): string | null {
  if (!code?.startsWith("password.")) return null;
  const key = code.slice("password.".length);
  return t.has(`error.${key}` as never) ? t(`error.${key}` as never) : null;
}
