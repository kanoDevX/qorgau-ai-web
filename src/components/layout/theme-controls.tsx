"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Check, Languages, Moon, Sun, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";
import { LOCALE_COOKIE } from "@/lib/auth/cookies";
import { setPreferenceCookie } from "@/lib/consent";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme !== "light";
  // The theme lives in localStorage, so the server can't know it: render a theme-neutral label
  // until mounted, otherwise a light-theme user gets a hydration mismatch on every page.
  const label = !mounted ? t("themeToggle") : isDark ? t("toLight") : t("toDark");
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && !isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const current = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on Escape or a click outside — a menu that can only be closed by re-clicking the
  // trigger traps keyboard and screen-reader users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  function pick(l: Locale) {
    setPreferenceCookie(LOCALE_COOKIE, l);
    window.location.reload();
  }
  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("language")}: ${localeNames[current]}`}
      >
        <Languages className="size-4" />
        <span className="uppercase">{current}</span>
      </Button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("language")}
          className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-pop)]"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                role="option"
                aria-selected={l === current}
                onClick={() => pick(l)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                {localeNames[l]}
                {l === current && <Check className="size-3.5 text-[var(--brand)]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DensityToggle() {
  const t = useTranslations("common");
  const [comfortable, setComfortable] = useState(false);
  useEffect(() => {
    setComfortable(document.documentElement.dataset.density === "comfortable");
  }, []);
  function toggle() {
    const next = !comfortable;
    setComfortable(next);
    document.documentElement.dataset.density = next ? "comfortable" : "default";
    setPreferenceCookie("qorgau_density", next ? "comfortable" : "default");
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={comfortable}
      aria-label={t("largeText")}
      title={t("largeText")}
      className={cn(comfortable && "text-[var(--brand)]")}
    >
      <Type className="size-4" />
    </Button>
  );
}
