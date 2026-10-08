"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IdentifierGraph } from "@/lib/api/hooks";
import { nodeColor, resolveColor } from "./node-kinds";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GNode = { id: string; label: string; kind: string; risk: number; confirmed: boolean; depth: number };
type GLink = { source: string; target: string; weight: number };

export function FraudGraphCanvas({
  data,
  onSelect,
  height = 460,
}: {
  data: IdentifierGraph;
  onSelect?: (node: GNode) => void;
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graph = useMemo(() => {
    const nodes: GNode[] = (data.nodes ?? []).map((n) => ({
      id: n.id!,
      label: n.masked ?? "—",
      kind: n.kind ?? "Domain",
      risk: n.riskScore ?? 0,
      confirmed: !!n.confirmedFraud,
      depth: n.depth ?? 0,
    }));
    const links: GLink[] = (data.edges ?? []).map((e) => ({
      source: e.source!,
      target: e.target!,
      weight: e.weight ?? 1,
    }));
    return { nodes, links };
  }, [data]);

  return (
    <div ref={wrapRef} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <ForceGraph2D
        graphData={graph}
        width={width}
        height={height}
        backgroundColor="transparent"
        cooldownTicks={80}
        linkColor={() => resolveColor("var(--graph-link)")}
        linkWidth={(l) => 0.6 + Math.min(3, (l as GLink).weight * 0.6)}
        nodeRelSize={5}
        nodeVal={(n) => 1 + ((n as GNode).risk / 100) * 4}
        nodeLabel={(n) => `${(n as GNode).kind} · ${(n as GNode).label} · risk ${(n as GNode).risk}`}
        onNodeClick={(n) => onSelect?.(n as GNode)}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node, ctx, scale) => {
          const n = node as GNode & { x: number; y: number };
          const r = (1 + (n.risk / 100) * 4) * 1.4;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = resolveColor(nodeColor(n.kind, n.confirmed));
          ctx.fill();
          if (n.depth === 0) {
            ctx.lineWidth = 1.5 / scale;
            ctx.strokeStyle = resolveColor("var(--graph-label)");
            ctx.stroke();
          }
          if (scale > 1.6) {
            ctx.font = `${10 / scale}px Inter, sans-serif`;
            ctx.fillStyle = resolveColor("var(--graph-label)");
            ctx.textAlign = "center";
            ctx.fillText(n.label, n.x, n.y + r + 8 / scale);
          }
        }}
      />
    </div>
  );
}

export type { GNode };
