import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps same-site paths and rejects everything else", () => {
    expect(safeNext("/learn?tab=1")).toBe("/learn?tab=1");
    expect(safeNext("//evil.example")).toBe("/check");
    expect(safeNext("/\\evil.example")).toBe("/check");
    expect(safeNext("https://evil.example")).toBe("/check");
    expect(safeNext(null, "/family")).toBe("/family");
  });
});
