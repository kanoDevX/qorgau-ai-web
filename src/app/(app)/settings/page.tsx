"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Contrast, LogOut, Moon, ShieldCheck, Sun, Type } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/layout/profile-form";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";
import { LOCALE_COOKIE } from "@/lib/auth/cookies";
import { useSession } from "@/lib/auth/session";
import { setPreferenceCookie } from "@/lib/consent";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { resolvedTheme, setTheme } = useTheme();
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const { isAuthenticated, signOut } = useSession();

  const [mounted, setMounted] = useState(false);
  const [senior, setSenior] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  useEffect(() => {
    setMounted(true);
    setSenior(document.documentElement.dataset.density === "comfortable");
    setHighContrast(document.documentElement.dataset.contrast === "more");
  }, []);

  function toggleContrast(v: boolean) {
    setHighContrast(v);
    if (v) document.documentElement.dataset.contrast = "more";
    else delete document.documentElement.dataset.contrast;
    setPreferenceCookie("qorgau_contrast", v ? "more" : "normal");
  }

  function setLocale(l: Locale) {
    setPreferenceCookie(LOCALE_COOKIE, l);
    window.location.reload();
  }

  function toggleSenior(v: boolean) {
    setSenior(v);
    document.documentElement.dataset.density = v ? "comfortable" : "default";
    setPreferenceCookie("qorgau_density", v ? "comfortable" : "default");
  }

  return (
    <>
      <PageHeader title={t("title")} />

      <div className="max-w-2xl space-y-5">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>{t("theme")} · {t("language")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Setting label={t("theme")}>
              <div className="flex gap-1.5">
                {(["dark", "light"] as const).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs",
                      mounted && (resolvedTheme ?? "dark") === th
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "border-[var(--border)] text-[var(--text-muted)]",
                    )}
                  >
                    {th === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                    {th === "dark" ? t("themeDark") : t("themeLight")}
                  </button>
                ))}
              </div>
            </Setting>

            <Setting label={t("language")}>
              <div className="flex flex-wrap gap-1.5">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs",
                      l === currentLocale
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "border-[var(--border)] text-[var(--text-muted)]",
                    )}
                  >
                    {localeNames[l]}
                  </button>
                ))}
              </div>
            </Setting>

            <Setting label={t("seniorMode")} hint={t("seniorHint")}>
              <div className="flex items-center gap-2">
                <Type className="size-4 text-[var(--text-muted)]" />
                <Switch checked={senior} onCheckedChange={toggleSenior} aria-label={t("seniorMode")} />
              </div>
            </Setting>

            <Setting label={t("highContrast")} hint={t("highContrastHint")}>
              <div className="flex items-center gap-2">
                <Contrast className="size-4 text-[var(--text-muted)]" aria-hidden />
                <Switch checked={highContrast} onCheckedChange={toggleContrast} aria-label={t("highContrast")} />
              </div>
            </Setting>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--brand)]" aria-hidden /> {t("privacyLink")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">{t("privacyLinkHint")}</p>
            <Button asChild variant="outline">
              <Link href="/settings/privacy">{t("privacyLink")}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Loads after the cards above, so it sits below them: no layout shift under the pointer. */}
        {isAuthenticated && <ProfileForm />}

        {isAuthenticated && (
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            <LogOut className="size-4" aria-hidden /> {t("signOut")}
          </Button>
        )}
      </div>
    </>
  );
}

function Setting({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        {hint && <p className="text-xs text-[var(--text-subtle)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

