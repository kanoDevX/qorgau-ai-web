import { describe, expect, it } from "vitest";
import { parseConsent } from "./consent";
import { FACTS, getFact } from "@/config/facts";

describe("cookie consent cookie format", () => {
  it("parses the v1 format", () => {
    expect(parseConsent("v1.0.0")).toEqual({ preferences: false, analytics: false });
    expect(parseConsent("v1.1.0")).toEqual({ preferences: true, analytics: false });
    expect(parseConsent("v1.1.1")).toEqual({ preferences: true, analytics: true });
  });

  it("treats anything unknown as 'no decision yet' so the banner is shown again", () => {
    for (const raw of [undefined, "", "v2.1.1", "v1.1", "v1.yes.no", "garbage"]) {
      expect(parseConsent(raw)).toBeNull();
    }
  });
});

describe("statistics registry (§3.12)", () => {
  it("only exposes verified facts, each with a source and a date", () => {
    for (const f of FACTS) {
      const exposed = getFact(f.id);
      if (!f.verified) {
        expect(exposed).toBeUndefined();
        continue;
      }
      expect(exposed?.sourceName).toBeTruthy();
      expect(exposed?.asOf).toMatch(/^\d{4}-\d{2}$/);
      expect(Number.isFinite(Number(exposed?.value))).toBe(true);
    }
  });
});
