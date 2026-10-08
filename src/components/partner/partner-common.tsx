"use client";

import { useTranslations } from "next-intl";
import { Building2, Check, Copy, KeyRound } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Skeleton } from "@/components/ui/primitives";
import { useCreatePartnerAccount, usePartnerAccount, type IssuedKey, type PartnerAccount } from "@/lib/api/hooks";
import { toApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";

export function ApiErrorLine({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-[var(--risk-danger-fg)]">
      {toApiError(error).message}
    </p>
  );
}

/** Shows a secret exactly once with a copy button (API keys, webhook secrets). */
export function SecretReveal({ title, value, note, onDone }: { title: string; value: string; note: string; onDone?: () => void }) {
  const t = useTranslations("partner.rawKey");
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="space-y-2 rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] p-4" data-testid="secret-reveal">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <KeyRound className="size-4 text-[var(--brand)]" aria-hidden /> {title}
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
        <code className="flex-1 break-all font-mono text-xs text-[var(--text)]" data-testid="secret-value">
          {value}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
          aria-label={copied ? t("copied") : t("copy")}
          className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-3)]"
        >
          {copied ? <Check className="size-4 text-[var(--risk-safe-fg)]" /> : <Copy className="size-4" />}
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)]">{note}</p>
      {onDone && (
        <Button size="sm" variant="outline" onClick={onDone}>
          {t("done")}
        </Button>
      )}
    </div>
  );
}

export function IssuedKeyReveal({ issued, onDone }: { issued: IssuedKey; onDone: () => void }) {
  const t = useTranslations("partner.rawKey");
  return <SecretReveal title={t("title")} value={issued.rawKey} note={t("once")} onDone={onDone} />;
}

const PartnerAccountContext = createContext<PartnerAccount | null>(null);

/** The signed-in owner's partner account; only available under <PartnerGate>. */
export function usePartner(): PartnerAccount {
  const account = useContext(PartnerAccountContext);
  if (!account) throw new Error("usePartner() outside <PartnerGate>");
  return account;
}

/**
 * Loads the caller's partner account for every /partner/* page. No account → onboarding, which shows
 * the sandbox key once after creation; otherwise provides the account to the pages.
 */
export function PartnerGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("partner.onboard");
  const { userId, ready } = useSession();
  const account = usePartnerAccount(!!userId);
  const create = useCreatePartnerAccount();
  const [name, setName] = useState("");
  const [issued, setIssued] = useState<IssuedKey | null>(null);

  if (ready && !userId) return <SignInPrompt />;
  if (!userId || account.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (account.isError) return <ApiErrorLine error={account.error} />;

  if (!account.data) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-[var(--brand)]" aria-hidden /> {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length >= 2) create.mutate(name.trim(), { onSuccess: (r) => setIssued(r.sandboxKey) });
            }}
          >
            <p className="text-sm text-[var(--text-muted)]">{t("lead")}</p>
            <label htmlFor="partner-name" className="block text-sm font-medium text-[var(--text)]">
              {t("name")}
            </label>
            <Input id="partner-name" value={name} maxLength={128} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
            <Button type="submit" disabled={name.trim().length < 2 || create.isPending}>
              {t("create")}
            </Button>
            <ApiErrorLine error={create.error} />
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <PartnerAccountContext.Provider value={account.data}>
      {issued && (
        <div className="mb-5">
          <IssuedKeyReveal issued={issued} onDone={() => setIssued(null)} />
        </div>
      )}
      {children}
    </PartnerAccountContext.Provider>
  );
}
