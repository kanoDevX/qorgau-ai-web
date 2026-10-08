"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/primitives";
import { useMyProfile, useUpdateProfile } from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { KZ_REGIONS } from "@/lib/kz";
import type { Locale } from "@/lib/i18n/config";

const TRACKS = ["General", "Retiree", "Parent", "StudentFreelancer", "Entrepreneur", "Teen"] as const;
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => THIS_YEAR - 6 - i);
const selectCls = "mt-1 h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] disabled:opacity-60";

/** GET/PUT /me — name, track, home region, year + month of birth (§3.17). */
export function ProfileForm() {
  const t = useTranslations("profile");
  const tt = useTranslations("register.tracks");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const profile = useMyProfile();
  const save = useUpdateProfile();

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [track, setTrack] = useState<string>("General");
  const [region, setRegion] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  // Fill the form once; later refetches must not overwrite what the person is typing.
  useEffect(() => {
    const p = profile.data;
    if (!p || hydrated) return;
    setName(p.displayName);
    setTrack(p.track);
    setRegion(p.homeRegionCode ?? "");
    setYear(p.birthYear);
    setMonth(p.birthMonth);
    setHydrated(true);
  }, [profile.data, hydrated]);

  if (profile.isError) return null; // not signed in (demo without account)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-4" /> {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              displayName: name.trim(),
              track,
              homeRegionCode: region || null,
              birthYear: year && month ? year : null,
              birthMonth: year && month ? month : null,
            });
          }}
        >
          <p className="text-sm text-[var(--text-muted)]">{t("lead")}</p>
          {profile.data?.limitedMode && (
            <p className="rounded-lg bg-[var(--risk-caution-bg)] p-3 text-sm text-[var(--risk-caution-fg)]" data-testid="limited-mode">
              {t("limitedMode")}
            </p>
          )}
          {profile.data?.minorApproval === "Approved" && <p className="text-sm text-[var(--risk-safe-fg)]">{t("approved")}</p>}
          <div>
            <label htmlFor="profile-name" className="text-sm font-medium text-[var(--text)]">{t("name")}</label>
            <Input id="profile-name" value={name} maxLength={128} disabled={!hydrated} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-track" className="text-sm font-medium text-[var(--text)]">{t("track")}</label>
              <select id="profile-track" value={track} disabled={!hydrated} onChange={(e) => setTrack(e.target.value)} className={selectCls}>
                {TRACKS.map((k) => (
                  <option key={k} value={k}>
                    {tt(k)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="profile-region" className="text-sm font-medium text-[var(--text)]">{t("region")}</label>
              <select id="profile-region" value={region} disabled={!hydrated} onChange={(e) => setRegion(e.target.value)} className={selectCls}>
                <option value="">{t("regionNone")}</option>
                {KZ_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r[locale]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="profile-year" className="text-sm font-medium text-[var(--text)]">{t("birthYear")}</label>
              <select id="profile-year" value={year ?? ""} disabled={!hydrated} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)} className={selectCls}>
                <option value="">{t("notSet")}</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="profile-month" className="text-sm font-medium text-[var(--text)]">{t("birthMonth")}</label>
              <select id="profile-month" value={month ?? ""} disabled={!hydrated} onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)} className={selectCls}>
                <option value="">{t("notSet")}</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {format.dateTime(new Date(2000, i, 1), { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={!hydrated || !name.trim() || save.isPending}>
            {t("save")}
          </Button>
          <div aria-live="polite">
            {save.isSuccess && <p className="text-sm text-[var(--risk-safe-fg)]">{t("saved")}</p>}
            {save.error && <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">{toApiError(save.error).message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
