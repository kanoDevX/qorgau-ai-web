"use client";

import { useFormatter, useTranslations } from "next-intl";
import { BellRing, Check, Copy, HeartHandshake, KeyRound, LogOut, ShieldCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { Input } from "@/components/ui/primitives";
import {
  useApproveMinor,
  useCreateFamily,
  useCreateFamilyInvite,
  useFamilySos,
  useJoinFamily,
  useRemoveFamilyMember,
  useSetSafeWordRotation,
  type FamilyRole,
  type FamilyView,
} from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const ROLES: FamilyRole[] = ["Member", "Protected", "Guardian"];

/** Accepts the full invite link, or just the `<familyId>.<code>` token from it. */
export function parseInvite(input: string): { familyId: string; code: string } | null {
  const raw = input.trim();
  let token = raw;
  try {
    token = new URL(raw).searchParams.get("join") ?? raw;
  } catch {
    // not a URL — treat as a bare token
  }
  const m = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9-]{8,12})$/i.exec(token);
  return m ? { familyId: m[1]!, code: m[2]! } : null;
}

function ErrorLine({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">
      {toApiError(error).message}
    </p>
  );
}

export function NoFamily({ initialInvite }: { initialInvite: string }) {
  const t = useTranslations("family");
  const [name, setName] = useState("");
  const create = useCreateFamily();
  const join = useJoinFamily();
  const [invite, setInvite] = useState(initialInvite);
  const [role, setRole] = useState<FamilyRole>("Member");
  const [share, setShare] = useState(false); // never pre-ticked (§3.6)
  const tg = useTranslations("guardian.safeWord");
  const parsed = parseInvite(invite);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-[var(--brand)]" /> {t("createTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) create.mutate(name.trim());
            }}
          >
            <p className="text-sm text-[var(--text-muted)]">{t("createLead")}</p>
            <label htmlFor="family-name" className="block text-sm font-medium text-[var(--text)]">
              {t("nameLabel")}
            </label>
            <Input id="family-name" value={name} maxLength={64} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
            <Button type="submit" className="w-full" disabled={!name.trim() || create.isPending}>
              {t("create")}
            </Button>
            <ErrorLine error={create.error} />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-[var(--brand)]" /> {t("joinTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (parsed) join.mutate({ ...parsed, role, shareRiskBandWithGuardians: role === "Protected" && share });
            }}
          >
            <p className="text-sm text-[var(--text-muted)]">{t("joinLead")}</p>
            <label htmlFor="family-invite" className="block text-sm font-medium text-[var(--text)]">
              {t("inviteLabel")}
            </label>
            <Input
              id="family-invite"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              aria-invalid={invite.length > 0 && !parsed}
              aria-describedby={invite.length > 0 && !parsed ? "family-invite-err" : undefined}
            />
            {invite.length > 0 && !parsed && (
              <p id="family-invite-err" className="text-xs text-[var(--risk-danger-fg)]">
                {t("invalidInvite")}
              </p>
            )}
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-[var(--text)]">{t("joinAs")}</legend>
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm",
                    role === r ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--border)]",
                  )}
                >
                  <input type="radio" name="family-role" value={r} checked={role === r} onChange={() => setRole(r)} className="mt-1 accent-[var(--brand)]" />
                  <span>
                    <span className="font-medium text-[var(--text)]">{t(`role.${r}`)}</span>
                    <span className="block text-xs text-[var(--text-muted)]">{t(`roleHint.${r}`)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            {role === "Protected" && (
              <ConsentCheckbox id="family-share" checked={share} onChange={setShare} label={t("consentProtected")} linkHref="/legal/privacy" linkLabel={tg("readPolicy")} />
            )}
            <Button type="submit" className="w-full" disabled={!parsed || join.isPending || (role === "Protected" && !share)}>
              {t("join")}
            </Button>
            <ErrorLine error={join.error} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function MembersCard({ family }: { family: FamilyView }) {
  const t = useTranslations("family");
  const tb = useTranslations("guardian.dashboard.band");
  const remove = useRemoveFamilyMember();
  const approve = useApproveMinor();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-[var(--brand)]" /> {family.name}
        </CardTitle>
        <p className="text-xs text-[var(--text-muted)]">{t("members", { count: family.members.length, max: family.maxMembers })}</p>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-[var(--border)]">
          {family.members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3" data-testid="family-member">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text)]">
                  {m.displayName}
                  {m.isMe && <span className="text-[var(--text-muted)]"> · {t("you")}</span>}
                  {m.isOwner && <span className="text-[var(--text-muted)]"> · {t("owner")}</span>}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {t(`role.${m.role as FamilyRole}`)}
                  {m.role === "Protected" && family.iAmGuardian && (
                    <> · {m.riskBand ? t("band", { band: tb(m.riskBand as never) }) : t("bandHidden")}</>
                  )}
                </p>
                {m.minorPendingApproval && <p className="text-xs text-[var(--risk-caution-fg)]">{t("minorPending")}</p>}
              </div>
              {m.minorPendingApproval && family.iAmGuardian && !m.isMe && (
                <Button size="sm" variant="soft" disabled={approve.isPending} onClick={() => approve.mutate(m.userId)}>
                  <ShieldCheck /> {t("approveMinor")}
                </Button>
              )}
              {m.isMe && !(m.isOwner && family.members.length > 1) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.confirm(t("confirmLeave")) && remove.mutate(m.userId)}
                >
                  <LogOut /> {t("leave")}
                </Button>
              )}
              {!m.isMe && family.iAmGuardian && !m.isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`${t("remove")}: ${m.displayName}`}
                  onClick={() => window.confirm(t("confirmRemove", { name: m.displayName })) && remove.mutate(m.userId)}
                >
                  <UserMinus />
                  <span className="sr-only sm:not-sr-only">{t("remove")}</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
        <ErrorLine error={remove.error ?? approve.error} />
      </CardContent>
    </Card>
  );
}

export function InviteCard() {
  const t = useTranslations("family");
  const format = useFormatter();
  const invite = useCreateFamilyInvite();
  const [copied, setCopied] = useState(false);
  const data = invite.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="size-4 text-[var(--brand)]" /> {t("inviteTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">{t("inviteLead")}</p>
        {data ? (
          <div className="flex flex-col items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- server-rendered data URL */}
            <img src={data.qrDataUrl} alt={t("qrAlt")} width={180} height={180} className="rounded-lg bg-white p-2" />
            <p className="font-mono text-2xl tracking-[0.2em] text-[var(--text)]" data-testid="invite-code">
              {data.code}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t("inviteExpires", { time: format.dateTime(new Date(data.expiresOnUtc), { dateStyle: "medium", timeStyle: "short" }) })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(data.link);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copyLink")}
            </Button>
            <Input readOnly value={data.link} aria-label={t("inviteLabel")} data-testid="invite-link" className="text-xs" />
          </div>
        ) : (
          <Button className="w-full" disabled={invite.isPending} onClick={() => invite.mutate()}>
            {t("createInvite")}
          </Button>
        )}
        <ErrorLine error={invite.error} />
      </CardContent>
    </Card>
  );
}

export function SosCard() {
  const t = useTranslations("family");
  const sos = useFamilySos();

  return (
    <Card className="border-[var(--risk-danger)]/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4 text-[var(--risk-danger-fg)]" /> {t("sosTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">{t("sosLead")}</p>
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          disabled={sos.isPending}
          onClick={() => window.confirm(t("sosConfirm")) && sos.mutate()}
        >
          {t("sosButton")}
        </Button>
        {sos.data && (
          <p role="status" className="text-sm text-[var(--text)]">
            {sos.data.devicesReached > 0
              ? t("sosSent", { people: sos.data.guardiansNotified, devices: sos.data.devicesReached })
              : t("sosNoDevices")}
          </p>
        )}
        <ErrorLine error={sos.error} />
      </CardContent>
    </Card>
  );
}

const ROTATION_OPTIONS = [30, 60, 90, 180];

export function RotationCard({ family }: { family: FamilyView }) {
  const t = useTranslations("family");
  const format = useFormatter();
  const setRotation = useSetSafeWordRotation();
  const sw = family.safeWord;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4 text-[var(--brand)]" /> {t("rotationTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!sw.isSet ? (
          <p className="text-[var(--text-muted)]">{t("rotationNotSet")}</p>
        ) : sw.isDue ? (
          <p className="rounded-lg bg-[var(--risk-caution-bg)] p-3 text-[var(--risk-caution-fg)]">{t("rotationDue", { days: sw.rotateEveryDays })}</p>
        ) : (
          sw.dueOnUtc && <p className="text-[var(--text-muted)]">{t("rotationOk", { date: format.dateTime(new Date(sw.dueOnUtc), { dateStyle: "long" }) })}</p>
        )}
        {sw.isSet && family.iAmGuardian && (
          <label className="flex items-center gap-2 text-[var(--text)]">
            {t("rotationEvery")}
            <select
              value={sw.rotateEveryDays}
              disabled={setRotation.isPending}
              onChange={(e) => setRotation.mutate(Number(e.target.value))}
              className="h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-sm"
            >
              {ROTATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {t("rotationDays", { days: d })}
                </option>
              ))}
            </select>
          </label>
        )}
        <ErrorLine error={setRotation.error} />
      </CardContent>
    </Card>
  );
}

export function ProtectedExplainer() {
  const t = useTranslations("family");
  return (
    <Card className="bg-[var(--surface-2)]">
      <CardContent className="flex gap-3 p-4">
        <HeartHandshake className="mt-0.5 size-5 shrink-0 text-[var(--brand)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{t("protectedExplainTitle")}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t("protectedExplain")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
