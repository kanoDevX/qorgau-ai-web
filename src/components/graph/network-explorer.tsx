"use client";

import { useTranslations } from "next-intl";
import { Network, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Skeleton } from "@/components/ui/primitives";
import { FraudGraphCanvas, type GNode } from "@/components/graph/fraud-graph-canvas";
import { CONFIRMED_FRAUD_COLOR, NODE_KIND_META } from "@/components/graph/node-kinds";
import { useFraudClusters, useIdentifierGraph } from "@/lib/api/hooks";
import { riskVisual } from "@/lib/risk";
import { formatRelative } from "@/lib/utils";

/**
 * Fraud-network explorer. Lives as the "Networks" tab of the Threat map (/radar?tab=network).
 * The canvas has a text alternative: the cluster list on the right and the node list under the graph.
 */
export function NetworkExplorer() {
  const t = useTranslations("graph");
  const [query, setQuery] = useState("");
  const [seed, setSeed] = useState<string | undefined>();
  const [selected, setSelected] = useState<GNode | null>(null);

  const clusters = useFraudClusters(12);
  const graph = useIdentifierGraph(seed, 3);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) setSeed(query.trim());
            }}
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("exploreHint")}
              aria-label={t("explore")}
            />
            <Button type="submit">
              <Search className="size-4" /> {t("explore")}
            </Button>
          </form>

          {!seed && (
            <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Network className="size-8 text-[var(--text-subtle)]" />
              <p className="max-w-sm text-sm text-[var(--text-muted)]">{t("exploreHint")}</p>
              <button
                className="text-xs text-[var(--brand)] underline-offset-2 hover:underline"
                onClick={() => {
                  setQuery("+77010000001");
                  setSeed("+77010000001");
                }}
              >
                +7 701 000 00 01
              </button>
            </Card>
          )}

          {seed && graph.isLoading && <Skeleton className="h-[460px] w-full rounded-xl" />}
          {seed && graph.data && (
            <>
              <FraudGraphCanvas data={graph.data} onSelect={setSelected} />
              <Legend />
              <details className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
                <summary className="cursor-pointer font-medium text-[var(--text)]">{t("nodesAsText")}</summary>
                <table className="mt-3 w-full text-left text-xs">
                  <caption className="sr-only">{t("nodesAsText")}</caption>
                  <thead className="text-[var(--text-muted)]">
                    <tr>
                      <th scope="col" className="py-1 pr-2 font-medium">{t("nodeColKind")}</th>
                      <th scope="col" className="py-1 pr-2 font-medium">{t("nodeColId")}</th>
                      <th scope="col" className="py-1 font-medium">{t("nodeColRisk")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(graph.data.nodes ?? []).map((n) => (
                      <tr key={n.id ?? n.masked} className="border-t border-[var(--border)]">
                        <td className="py-1 pr-2 text-[var(--text-muted)]">{t(`nodeKind.${n.kind}` as never)}</td>
                        <td className="py-1 pr-2 font-id text-[var(--text)]">{n.masked ?? n.id}</td>
                        <td className="py-1 text-[var(--text)]">
                          {n.riskScore ?? 0}
                          {n.confirmedFraud ? ` · ${t("confirmedFraud")}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
          {seed && graph.isError && (
            <Card className="p-6 text-center text-sm text-[var(--text-muted)]">{t("empty")}</Card>
          )}
        </div>

        <aside className="space-y-4">
          {selected && (
            <Card className="p-4">
              <p className="text-xs text-[var(--text-subtle)]">
                {t(`nodeKind.${selected.kind}`)}
              </p>
              <p className="mt-0.5 font-id text-sm text-[var(--text)]">{selected.label}</p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    background: riskVisual(selected.risk).bg,
                    color: riskVisual(selected.risk).fg,
                  }}
                >
                  risk {selected.risk}
                </span>
                {selected.confirmed && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--risk-critical-fg)]">
                    <ShieldAlert className="size-3.5" /> {t("confirmedFraud")}
                  </span>
                )}
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold text-[var(--text)]">{t("clusters")}</h2>
            <div className="space-y-2">
              {clusters.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              {clusters.data?.length === 0 && (
                <Card className="p-4 text-xs text-[var(--text-muted)]">{t("empty")}</Card>
              )}
              {clusters.data?.map((c) => {
                const v = riskVisual(Math.round((c.confidenceScore ?? 0) * 100));
                return (
                  <Card key={c.clusterId} className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {t("cluster")} · {c.regionCode}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: v.bg, color: v.fg }}
                      >
                        {Math.round((c.confidenceScore ?? 0) * 100)}% {t("confidence")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {c.nodeCount} {t("nodes")} · {c.distinctReporterCount} {t("reporters")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-subtle)]">
                      {t("detected")} {formatRelative(c.detectedOnUtc ?? new Date().toISOString())}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Legend() {
  const t = useTranslations("graph");
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text)]">{t("legend")}:</span>
      {Object.entries(NODE_KIND_META).map(([kind, meta]) => (
        <span key={kind} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: meta.color }} />
          {t(`nodeKind.${kind}`)}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full" style={{ background: CONFIRMED_FRAUD_COLOR }} />
        {t("confirmedFraud")}
      </span>
    </div>
  );
}
