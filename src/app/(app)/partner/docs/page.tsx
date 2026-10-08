"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { CheckoutPlayground } from "@/components/partner/playground";

const REQUEST = `curl -X POST https://<api-host>/api/v1/partners/risk-check \
  -H "X-Api-Key: pk_test_…" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Send the prepayment first, I will post the item later",
    "recipientIdentifier": "+77000000666",
    "languageCode": "en"
  }'`;

const RESPONSE = `{
  "assessmentId": "01a1…",          // null in the sandbox
  "riskScore": 92,
  "riskBand": "Critical",
  "category": "BankImpersonationCall",
  "recommendedAction": "BlockAndReport",
  "redFlags": ["…"],
  "recipient": { "masked": "+7700*****66", "verdict": "confirmed_fraud",
                 "communityRiskScore": 95, "totalReports": 12, "inFraudCluster": true },
  "degradedMode": false,
  "sandbox": true
}`;

const HEADER = "Qorgau-Signature: t=1760000000,v1=<hex HMAC-SHA256(secret, `${t}.${rawBody}`)>";

const VERIFY = `import crypto from "node:crypto";

// express.raw({ type: "application/json" }) — sign the raw body, not re-serialised JSON.
export function verifyQorgau(rawBody, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false; // replay window: 5 min
  const expected = crypto.createHmac("sha256", secret).update(\`\${t}.\${rawBody}\`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 ?? ""));
}`;

function Code({ children, label }: { children: string; label: string }) {
  return (
    <pre aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-[12px] leading-relaxed text-[var(--text)]">
      <code>{children}</code>
    </pre>
  );
}

/** Public developer docs (pattern: Stripe API reference — one request, one response, test values that trigger each branch). */
export default function PartnerDocsPage() {
  const t = useTranslations("partner.docs");
  return (
    <div className="min-w-0 space-y-6">
      <section aria-labelledby="qs-title" className="space-y-3">
        <h2 id="qs-title" className="text-lg font-semibold text-[var(--text)]">{t("title")}</h2>
        <p className="text-sm text-[var(--text-muted)]">{t("lead")}</p>
        {/* min-w-0: grid items default to min-width:auto, so long code lines would widen the page on phones. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="mb-1 text-sm font-medium text-[var(--text)]">{t("request")}</h3>
            <Code label={t("request")}>{REQUEST}</Code>
          </div>
          <div className="min-w-0">
            <h3 className="mb-1 text-sm font-medium text-[var(--text)]">{t("response")}</h3>
            <Code label={t("response")}>{RESPONSE}</Code>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="min-w-0 p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">{t("sandboxTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t("sandboxLead")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text)]" data-testid="sandbox-triggers">
            <li>{t("triggerHigh")}</li>
            <li>{t("triggerMedium")}</li>
            <li>{t("triggerFraud")}</li>
            <li>{t("triggerDefault")}</li>
          </ul>
        </Card>
        <Card className="min-w-0 p-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">{t("errorsTitle")}</h2>
          <dl className="mt-2 space-y-1 text-sm">
            {(["401", "403", "429"] as const).map((code) => (
              <div key={code} className="flex gap-3">
                <dt className="font-mono text-[var(--text)]">{code}</dt>
                <dd className="text-[var(--text-muted)]">{t(`e${code}`)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <section aria-labelledby="sig-title" className="space-y-2">
        <h2 id="sig-title" className="text-sm font-semibold text-[var(--text)]">{t("signatureTitle")}</h2>
        <p className="text-sm text-[var(--text-muted)]">{t("signatureLead")}</p>
        <Code label="Qorgau-Signature">{HEADER}</Code>
        <Code label={t("signatureTitle")}>{VERIFY}</Code>
        <a href="/backend/openapi/v1.json" className="inline-block text-sm text-[var(--brand)] underline underline-offset-2">{t("openapi")}</a>
      </section>

      <section aria-labelledby="try-title" className="space-y-2">
        <h2 id="try-title" className="text-sm font-semibold text-[var(--text)]">{t("tryTitle")}</h2>
        <p className="text-sm text-[var(--text-muted)]">{t("tryLead")}</p>
        <CheckoutPlayground />
      </section>
    </div>
  );
}
