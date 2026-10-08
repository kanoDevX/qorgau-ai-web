import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { business } from "@/config/business";
import { cookieRows, LEGAL_DOCS, legal, legalUi, type LegalDocId } from "@/content/legal";
import type { Locale } from "@/lib/i18n/config";

type Params = { doc: string };

export function generateStaticParams() {
  return [...LEGAL_DOCS, "data-request"].map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { doc } = await params;
  const locale = (await getLocale()) as Locale;
  if (!LEGAL_DOCS.includes(doc as LegalDocId)) return {};
  return { title: legal[locale][doc as LegalDocId].title };
}

/** Fills the {TOKENS} used in the legal copy from the single business config. */
function fill(text: string): string {
  return text
    .replaceAll("{COMPANY}", `${business.legalName}, ${business.legalForm}`)
    .replaceAll("{DPO_EMAIL}", business.dpoEmail)
    .replaceAll("{VERSION}", business.policyVersion);
}

export default async function LegalPage({ params }: { params: Promise<Params> }) {
  const { doc } = await params;
  const locale = (await getLocale()) as Locale;

  if (doc === "data-request") {
    const { DataRequestView } = await import("./data-request");
    return <DataRequestView />;
  }
  if (!LEGAL_DOCS.includes(doc as LegalDocId)) notFound();

  const content = legal[locale][doc as LegalDocId];
  const ui = legalUi[locale];

  return (
    <article className="text-[var(--text)]">
      <h1 className="text-[length:var(--text-title)]">{content.title}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {ui.updated} {business.policyVersion}
      </p>
      <p className="mt-4 text-base text-[var(--text-muted)]">{content.lead}</p>

      {!business.legalReviewed && (
        <p
          role="note"
          className="mt-5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-3 text-sm text-[var(--text-muted)]"
        >
          {ui.draft}
        </p>
      )}

      <nav aria-label={ui.contents} className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs font-semibold text-[var(--text-muted)]">{ui.contents}</p>
        <ol className="mt-2 space-y-1 text-sm">
          {content.sections.map((s, i) => (
            <li key={s.h}>
              <a href={`#s${i + 1}`} className="text-[var(--brand)] underline-offset-2 hover:underline">
                {s.h}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-8">
        {content.sections.map((s, i) => (
          <section key={s.h} id={`s${i + 1}`} className="scroll-mt-6">
            <h2 className="text-xl font-semibold tracking-tight">{s.h}</h2>
            {s.p?.map((p) => (
              <p key={p} className="mt-2 leading-relaxed text-[var(--text-muted)]">
                {fill(p)}
              </p>
            ))}
            {s.ul && (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed text-[var(--text-muted)]">
                {s.ul.map((li) => (
                  <li key={li}>{fill(li)}</li>
                ))}
              </ul>
            )}
            {doc === "cookies" && i === 1 && (
              <div
                className="mt-3 overflow-x-auto rounded-xl border border-[var(--border)] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
                tabIndex={0}
                role="region"
                aria-label={s.h}
              >
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <caption className="sr-only">{s.h}</caption>
                  <thead className="bg-[var(--surface-2)] text-[var(--text-muted)]">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold">{ui.cookieName}</th>
                      <th scope="col" className="px-3 py-2 font-semibold">{ui.cookiePurpose}</th>
                      <th scope="col" className="px-3 py-2 font-semibold">{ui.cookieDuration}</th>
                      <th scope="col" className="px-3 py-2 font-semibold">{ui.cookieCategory}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookieRows[locale].map((r) => (
                      <tr key={r.name} className="border-t border-[var(--border)] align-top">
                        <td className="px-3 py-2 font-mono text-xs text-[var(--text)]">{r.name}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{r.purpose}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{r.duration}</td>
                        <td className="px-3 py-2 text-[var(--text-muted)]">{r.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
