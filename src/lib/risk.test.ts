import { describe, expect, it } from "vitest";
import { bandForScore, clampScore, riskVisual } from "./risk";

describe("risk scale (single source of score → band → colour)", () => {
  it.each([
    [0, "Minimal"],
    [19, "Minimal"],
    [20, "Low"],
    [39, "Low"],
    [40, "Elevated"],
    [59, "Elevated"],
    [60, "High"],
    [79, "High"],
    [80, "Critical"],
    [100, "Critical"],
  ] as const)("score %i → %s", (score, band) => {
    expect(bandForScore(score)).toBe(band);
  });

  it("clamps out-of-range and NaN scores", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(140)).toBe(100);
    expect(clampScore(Number.NaN)).toBe(0);
    expect(bandForScore(999)).toBe("Critical");
  });

  it("maps every band to design tokens, never hex", () => {
    for (const s of [0, 30, 50, 70, 90]) {
      const v = riskVisual(s);
      expect(v.color).toMatch(/^var\(--risk-/);
      expect(v.fg).toMatch(/^var\(--risk-/);
    }
  });
});
