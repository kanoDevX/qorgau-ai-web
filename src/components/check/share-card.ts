"use client";

/**
 * Renders a shareable warning card (1080×1350 PNG) for WhatsApp / Telegram (§5.3). It contains only
 * the verdict, the scheme and the advice — never the user's original message. Colours are read
 * from the current theme tokens so the card matches what the user sees.
 */
export interface ShareCardContent {
  headline: string;
  category: string;
  steps: string[];
  footer: string;
  band: string;
}

function token(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.color = `var(--${name})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value || fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderShareCard(c: ShareCardContent): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const bandToken = { Minimal: "risk-safe", Low: "risk-low", Elevated: "risk-caution", High: "risk-danger", Critical: "risk-critical" }[c.band] ?? "risk-caution";

  ctx.fillStyle = token("bg", "#0a1a1e");
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = token(bandToken, "#f0557a");
  ctx.fillRect(0, 0, W, 24);

  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const display = getComputedStyle(document.documentElement).getPropertyValue("--font-unbounded").trim() || font;
  let y = 150;

  ctx.fillStyle = token(`${bandToken}-fg`, "#f79ab0");
  ctx.font = `600 72px ${display}`;
  for (const l of wrap(ctx, c.headline, W - 160)) {
    ctx.fillText(l, 80, y);
    y += 88;
  }

  y += 30;
  ctx.fillStyle = token("text-muted", "#a8c2c1");
  ctx.font = `500 40px ${font}`;
  ctx.fillText(c.category, 80, y);

  y += 90;
  ctx.fillStyle = token("text", "#e8f2f1");
  ctx.font = `400 44px ${font}`;
  c.steps.forEach((step, i) => {
    const lines = wrap(ctx, step, W - 230);
    ctx.fillStyle = token(bandToken, "#f0557a");
    ctx.font = `700 44px ${font}`;
    ctx.fillText(`${i + 1}`, 80, y);
    ctx.fillStyle = token("text", "#e8f2f1");
    ctx.font = `400 44px ${font}`;
    for (const l of lines) {
      ctx.fillText(l, 150, y);
      y += 58;
    }
    y += 26;
  });

  ctx.fillStyle = token("brand", "#5ed3e0");
  ctx.font = `600 40px ${display}`;
  ctx.fillText("QorgauAI", 80, H - 90);
  ctx.fillStyle = token("text-subtle", "#8fabaa");
  ctx.font = `400 30px ${font}`;
  ctx.fillText(c.footer, 80, H - 45);

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("render failed"))), "image/png"));
}

/** Web Share with the image when the device supports files; otherwise download it. */
export async function shareCard(blob: Blob, text: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], "qorgau-warning.png", { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], text, title: "QorgauAI" });
    return "shared";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
