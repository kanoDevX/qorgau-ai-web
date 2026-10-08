"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Bell, Mail, MapPin, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton, Switch } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/page-header";
import { useNotificationPrefs, useSaveNotificationPrefs } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { KZ_REGIONS, REPORT_CATEGORIES } from "@/lib/kz";
import type { Locale } from "@/lib/i18n/config";
import { pushSupported, subscribePush, unsubscribePush } from "@/lib/push";
import { SCAM_CATEGORY_LABELS } from "@/lib/risk";

/**
 * Notification centre settings (§5.3): what to watch (region, schemes) and through which channel.
 * In-app alerts are always on; e-mail digest and Web Push are opt-in and can be switched off here or
 * from any digest e-mail in one click.
 */
export default function NotificationSettingsPage() {
  const t = useTranslations("notifySettings");
  const locale = useLocale() as Locale;
  const { isAuthenticated } = useSession();
  const prefs = useNotificationPrefs(isAuthenticated);
  const save = useSaveNotificationPrefs();
  const [region, setRegion] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [email, setEmail] = useState(false);
  const [push, setPush] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Initialise the form once: a late server response must never overwrite what the user already chose.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!prefs.data || hydrated) return;
    setHydrated(true);
    setRegion(prefs.data.regionCode ?? "");
    setCategories([...(prefs.data.categories ?? [])]);
    setEmail(!!prefs.data.emailDigest);
    setPush(!!prefs.data.pushAlerts);
  }, [prefs.data, hydrated]);

  async function togglePush(on: boolean) {
    setPushNote(null);
    if (on) {
      const r = await subscribePush();
      if (r !== "subscribed") {
        setPushNote(t(`push.${r}`));
        return;
      }
    } else {
      await unsubscribePush();
    }
    setPush(on);
  }

  function submit() {
    setSaved(false);
    save.mutate(
      { regionCode: region || null, categories, emailDigest: email, pushAlerts: push },
      { onSuccess: () => setSaved(true) },
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <PageHeader title={t("title")} lead={t("lead")} />
        <Card className="max-w-2xl p-5">
          <p className="text-sm text-[var(--text-muted)]">{t("needSignIn")}</p>
          <Button asChild className="mt-3">
            <Link href="/login?next=%2Fsettings%2Fnotifications">{t("signIn")}</Link>
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="max-w-2xl space-y-5">
        {prefs.isLoading && <Skeleton className="h-64 w-full rounded-[var(--radius-xl)]" />}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-[var(--brand)]" aria-hidden /> {t("whatTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="notify-region" className="text-sm font-medium text-[var(--text)]">{t("region")}</label>
              <select
                id="notify-region"
                disabled={!hydrated}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
              >
                <option value="">{t("wholeCountry")}</option>
                {KZ_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r[locale]}
                  </option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="text-sm font-medium text-[var(--text)]">{t("schemes")}</legend>
              <p className="text-xs text-[var(--text-muted)]">{t("schemesHint")}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {REPORT_CATEGORIES.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--brand-solid)]"
                      disabled={!hydrated}
                      checked={categories.includes(c)}
                      onChange={(e) => setCategories((cs) => (e.target.checked ? [...cs, c] : cs.filter((x) => x !== c)))}
                    />
                    {SCAM_CATEGORY_LABELS[c]?.[locale] ?? c}
                  </label>
                ))}
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-[var(--brand)]" aria-hidden /> {t("channelsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row icon={Bell} label={t("inApp")} hint={t("inAppHint")}>
              <Switch checked disabled aria-label={t("inApp")} />
            </Row>
            <Row icon={Mail} label={t("email")} hint={t("emailHint")}>
              <Switch checked={email} onCheckedChange={setEmail} aria-label={t("email")} disabled={!hydrated} />
            </Row>
            <Row icon={Smartphone} label={t("pushLabel")} hint={pushSupported() ? t("pushHint") : t("push.unsupported")}>
              <Switch checked={push} onCheckedChange={(v) => void togglePush(v)} aria-label={t("pushLabel")} disabled={!pushSupported()} />
            </Row>
            {pushNote && <p role="status" className="text-sm text-[var(--risk-caution-fg)]">{pushNote}</p>}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={save.isPending || !hydrated}>
            {t("save")}
          </Button>
          <p role="status" aria-live="polite" className="text-sm text-[var(--text-muted)]">
            {saved ? t("saved") : save.isError ? t("saveError") : ""}
          </p>
        </div>
      </div>
    </>
  );
}

function Row({ icon: Icon, label, hint, children }: { icon: typeof Bell; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
        <div>
          <p className="text-sm font-medium text-[var(--text)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)]">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
