"use client";

import { useTranslations } from "next-intl";
import { CircleAlert, Cpu, ScrollText, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Progress } from "@/components/ui/primitives";
import { riskVisual } from "@/lib/risk";
import type { Assessment } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

type Explain = NonNullable<Assessment["explainability"]>;
type Layer = NonNullable<Explain["layers"]>[number];
type Signal = NonNullable<Explain["signals"]>[number];

const LAYER_ICON: Record<string, typeof Cpu> = {
  Heuristics: ScrollText,
  GeminiMultimodal: Cpu,
  CommunityReputation: Users,
  Ensemble: CircleAlert,
};

/**
 * Turns the "black box" score into a transparent breakdown: per-layer weight + confidence,
 * the raw signals, the model version and the ensemble weights JSON. Direct implementation of
 * the backend's Explainability & Audit Trail feature.
 */
export function ExplainabilityPanel({ assessment }: { assessment: Assessment }) {
  const t = useTranslations("risk");
  const ex = assessment.explainability;
  if (!ex) return null;

  const weights = safeParse(ex.ensembleWeightsJson);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60">
      <Accordion type="single" collapsible className="px-4">
        <AccordionItem value="layers">
          <AccordionTrigger>{t("why")}</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {ex.layers?.map((l) => <LayerRow key={l.layer} layer={l} />)}
            {ex.signals && ex.signals.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-3">
                {ex.signals.map((s, i) => <SignalRow key={i} signal={s} />)}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="audit">
          <AccordionTrigger>{t("auditTrail")}</AccordionTrigger>
          <AccordionContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <Meta k={t("modelVersion")} v={ex.geminiModelVersion ?? "—"} />
              <Meta k={t("promptTemplate")} v={ex.promptTemplateId ?? "—"} />
              <Meta k={t("promptHash")} v={ex.promptTemplateHash ? `${ex.promptTemplateHash.slice(0, 12)}…` : "—"} mono />
              <Meta k={t("latency")} v={t("latencyMs", { ms: assessment.latencyMs })} />
              <Meta k={t("assessmentId")} v={assessment.assessmentId?.slice(0, 8) ?? "—"} mono />
              {weights && <Meta k={t("ensembleWeights")} v={JSON.stringify(weights.base ?? weights)} mono />}
            </dl>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function LayerRow({ layer }: { layer: Layer }) {
  const t = useTranslations("risk");
  const Icon = LAYER_ICON[layer.layer ?? "Ensemble"] ?? Cpu;
  const v = riskVisual(layer.score ?? 0);
  return (
    <div className={cn("rounded-lg border border-[var(--border)] p-3", !layer.available && "border-dashed bg-[var(--bg-elevated)]")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
          <Icon className="size-4 text-[var(--text-muted)]" aria-hidden />
          {t(`layers.${layer.layer}`)}
        </span>
        {layer.available ? (
          <span className="text-sm font-semibold tabular-nums" style={{ color: v.fg }}>
            {layer.score}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-subtle)]">{t("unavailable")}</span>
        )}
      </div>
      {layer.available && (
        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
          <Progress value={(layer.weight ?? 0) * 100} className="h-1.5" indicatorColor={v.color} />
          <span className="tabular-nums">
            {t("weight")} {Math.round((layer.weight ?? 0) * 100)}%
          </span>
          <Progress value={(layer.confidence ?? 0) * 100} className="h-1.5" indicatorColor="var(--text-subtle)" />
          <span className="tabular-nums">
            {t("confidence")} {Math.round((layer.confidence ?? 0) * 100)}%
          </span>
        </div>
      )}
      {layer.note && <p className="mt-1.5 text-[11px] text-[var(--text-subtle)]">{layer.note}</p>}
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <code className="mt-0.5 rounded bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
        {signal.code}
      </code>
      <div>
        <span className="text-[var(--text)]">{signal.description}</span>
        {signal.evidence && (
          <span className="ml-1 text-[var(--text-subtle)]">— {truncate(signal.evidence, 90)}</span>
        )}
      </div>
    </div>
  );
}

function Meta({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[var(--text-subtle)]">{k}</dt>
      <dd className={cn("truncate text-[var(--text)]", mono && "font-mono text-[11px]")}>{v}</dd>
    </div>
  );
}

function safeParse(json?: string) {
  if (!json) return null;
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
