import { describe, expect, it } from "vitest";
import { isMinor } from "./age";

describe("isMinor", () => {
  const today = new Date(2026, 9, 3); // 3 Oct 2026
  it("matches the server's year+month rule", () => {
    expect(isMinor(2008, 10, today)).toBe(false);
    expect(isMinor(2008, 11, today)).toBe(true);
    expect(isMinor(2012, 1, today)).toBe(true);
    expect(isMinor(1950, 5, today)).toBe(false);
  });
  it("is false until both fields are chosen", () => {
    expect(isMinor(2012, null, today)).toBe(false);
    expect(isMinor(null, 3, today)).toBe(false);
  });
});
