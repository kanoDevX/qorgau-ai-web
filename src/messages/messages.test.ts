import { describe, expect, it } from "vitest";
import en from "./en.json";
import kk from "./kk.json";
import ru from "./ru.json";
import { cookieRows, legal, LEGAL_DOCS } from "@/content/legal";

// Messages are JSON: nested objects and arrays (e.g. goldenHour.offline) with string leaves.
type Tree = { [k: string]: unknown };

function keys(tree: unknown, prefix = ""): string[] {
  return Object.entries(tree as Tree).flatMap(([k, v]) => (typeof v === "string" ? [prefix + k] : keys(v, `${prefix}${k}.`)));
}

function placeholders(s: string): string[] {
  // Argument names only: "{count}" and "{count, plural, ...}" both yield "count"; plural branches like "{# day}" are ignored.
  return [...new Set([...s.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1] ?? ""))].sort();
}

function get(tree: unknown, path: string): string {
  return path.split(".").reduce<unknown>((node, k) => (node as Tree)[k], tree) as string;
}

describe("i18n completeness (ru is the reference)", () => {
  const ref = keys(ru);

  it.each([
    ["kk", kk],
    ["en", en],
  ] as const)("%s has exactly the same keys as ru", (_, messages) => {
    const other = keys(messages);
    expect(ref.filter((k) => !other.includes(k)), "missing").toEqual([]);
    expect(other.filter((k) => !ref.includes(k)), "extra").toEqual([]);
  });

  it.each([
    ["kk", kk],
    ["en", en],
  ] as const)("%s keeps the same ICU placeholders", (_, messages) => {
    const broken = ref.filter((k) => placeholders(get(ru, k)).join() !== placeholders(get(messages, k)).join());
    expect(broken).toEqual([]);
  });

  it("no key contains a dot (next-intl uses dots for nesting and throws at runtime)", () => {
    const rawKeys = (tree: unknown): string[] =>
      Object.entries(tree as Tree).flatMap(([k, v]) => [k, ...(typeof v === "object" && v ? rawKeys(v) : [])]);
    for (const messages of [ru, kk, en]) {
      expect(rawKeys(messages).filter((k) => k.includes("."))).toEqual([]);
    }
  });

  it("no raw angle brackets (ICU reads them as rich-text tags and throws at runtime)", () => {
    for (const messages of [ru, kk, en]) {
      expect(keys(messages).filter((k) => get(messages, k).includes("<"))).toEqual([]);
    }
  });

  it("English has no Cyrillic outside language names", () => {
    const leaks = keys(en).filter((k) => /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(get(en, k)) && !k.startsWith("languages"));
    expect(leaks).toEqual([]);
  });
});

describe("legal texts", () => {
  it("every document exists in every locale with the same number of sections", () => {
    for (const doc of LEGAL_DOCS) {
      const n = legal.ru[doc].sections.length;
      expect(legal.kk[doc].sections).toHaveLength(n);
      expect(legal.en[doc].sections).toHaveLength(n);
    }
  });

  it("the cookie table lists the same cookies in every locale", () => {
    const names = cookieRows.ru.map((r) => r.name);
    expect(cookieRows.kk.map((r) => r.name)).toEqual(names);
    expect(cookieRows.en.map((r) => r.name)).toEqual(names);
  });
});
