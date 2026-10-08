import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Static fallback shown when a page isn't available offline. Carries the whole emergency plan as plain
 * text, so even a never-opened install helps (§5.5). No data fetching, no client JS.
 */
export default async function OfflinePage() {
  const t = await getTranslations("goldenHour");
  const steps = t.raw("offline") as { title: string; detail: string }[];
  const contacts = t.raw("contactList") as string[];

  return (
    <div className="bg-[var(--bg)]">
      <main id="main" className="mx-auto min-h-dvh w-full max-w-xl px-4 py-10">
        <Logo className="mb-6" />
        <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <WifiOff className="size-4" aria-hidden /> {t("offlineNote")}
        </p>
        <h1 className="mt-2 text-[length:var(--text-title)] text-[var(--text)]">{t("title")}</h1>
        <p className="mt-2 text-[var(--text-muted)]">{t("lead")}</p>
        <ol className="mt-6 space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="font-semibold text-[var(--text)]">
                {i + 1}. {s.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{s.detail}</p>
            </li>
          ))}
        </ol>
        <h2 className="mt-8 text-lg font-semibold text-[var(--text)]">{t("contacts")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--text)]">
          {contacts.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm">
          <Link href="/check" className="text-[var(--brand)] underline underline-offset-2">
            QorgauAI
          </Link>
        </p>
      </main>
    </div>
  );
}
