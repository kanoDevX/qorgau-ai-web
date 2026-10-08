import { describe, expect, it } from "vitest";
import { checks, cvdChecks, MODES, resolve } from "./design-tokens.mjs";

describe("design tokens (§3.14)", () => {
  it("every text pair ≥ 4.5:1 and every UI pair ≥ 3:1 in all four modes", () => {
    const failures = checks()
      .filter((r) => r.ratio < r.min)
      .map((r) => `${r.mode}: --${r.fg} on --${r.bg} = ${r.ratio.toFixed(2)}`);
    expect(failures).toEqual([]);
  });

  it("adjacent risk bands stay distinguishable under deuteranopia and protanopia", () => {
    expect(cvdChecks().filter((r) => !r.ok)).toEqual([]);
  });

  it("every mode defines the full semantic set", () => {
    for (const [mode, vars] of Object.entries(MODES)) {
      for (const name of ["bg", "surface", "text", "brand", "brand-solid", "brand-fg", "ring", "risk-critical-fg"]) {
        expect(() => resolve(vars, `var(--${name})`), `${mode} --${name}`).not.toThrow();
      }
    }
  });
});
