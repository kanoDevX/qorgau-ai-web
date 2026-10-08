# QorgauAI — Web

The web client of **QorgauAI**, an anti-fraud assistant for Kazakhstan, talking to the ASP.NET Core 10
backend in [`../QorgauAI`](../QorgauAI/README.md).
Next.js 15 · React 19 · TypeScript (strict) · Tailwind v4 · Radix · next-intl · TanStack Query.

The interface is **"Calm Shield"** (version 2.0): a frightened or elderly person must never face a cluttered
screen, and every claim the product makes must be one it can back up. What changed and why (including
everything that was removed) is in [`../QorgauAI/docs/redesign/CHANGELOG.md`](../QorgauAI/docs/redesign/CHANGELOG.md);
the legal and trust checklist is [`../QorgauAI/docs/COMPLIANCE.md`](../QorgauAI/docs/COMPLIANCE.md).

---

## 1. Run it

```bash
# 1. backend (from ../QorgauAI):  dotnet run --project QorgauAI.Api --no-launch-profile --urls http://localhost:5199
cp .env.example .env.local          # API_ORIGIN defaults to http://localhost:5199
npm install
npm run gen:api                     # regenerate the typed client from the live OpenAPI schema
npm run dev                         # → http://localhost:3100
```

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Vitest: message parity, risk bands, consent logic, input detection, playbook, design tokens |
| `npm run tokens:check` | WCAG contrast + colour-blind (ΔE) check of every token pair → `../QorgauAI/docs/design/contrast.md` |
| `npm run build` | Production build. **Stop `npm run dev` first** — they share `.next` |
| `npm run test:e2e -- --workers=2` | Playwright (desktop + mobile) with axe on every screen; needs the API and no other server on :3100 |
| `npm run pwa:check` | Against `npm start -- -p 3100`: no CSP violations, the service worker installs, the emergency plan opens offline |
| `npm run lighthouse -- check pricing` | Lighthouse mobile for pages of a running production server |
| `node scripts/screenshots.mjs` | Dark / light / mobile screenshots of the key screens |

Accounts sign in with e-mail and password on `/login` (sign-up `/register`, reset `/forgot-password`). In Development the
reset e-mail is written to `../QorgauAI/QorgauAI.Api/bin/<config>/net10.0/App_Data/outbox/*.eml`.
Demo sign-in without a password (Development API only) is on `/onboarding`: **self**, **guardian**, **partner** (a
live-approved demo organisation); the same demo accounts also accept the password from `Demo:Password` in
`../QorgauAI/QorgauAI.Api/appsettings.Development.json`.

---

## 2. Screens

Five primary sections, identical in the mobile bottom bar and the desktop sidebar; SOS, notifications and the
profile menu live in the header; **Ctrl/⌘ K** opens the command palette and **?** the shortcut sheet.

| Section | Route | What is there |
|---|---|---|
| **Check** | `/check` | One entry for text, link, number, IBAN, screenshot, QR photo; modes *call* and *transfer*. Layer-by-layer progress over SSE, highlighted phrases, an honest "AI is unavailable" banner with the retry time, share card, scheme catalogue |
| **Home** | `/dashboard` | Next protective step and recent checks |
| **Threat map** | `/radar` | Tabs: feed (with votes), map of 17 regions + 3 cities with a table alternative, trends, fraud networks |
| **Learn** | `/learn` | Course path in your language, daily quests, phishing trainer (opt-in), "find 3 signs", certificates (PDF + public verification), region league (names opt-in) |
| **Family** | `/family` | Circle of up to 6, invite link + QR, protected members (risk band only, with consent), SOS, safe-word rotation, minor approval |
| Emergency | `/golden-hour` | First-hour plan, **works offline** (also `/offline`) |
| Account | `/settings`, `/settings/privacy`, `/settings/notifications` | Profile, theme and contrast, consents, sessions, export, deletion, digest and push |
| Partners | `/partner/*` | Overview, usage, keys (test/live, rotate), webhooks, plans and statements, public docs |
| Account access | `/login`, `/register`, `/forgot-password`, `/reset-password` | Password sign-in with lockout, keep-me-signed-in, reset by e-mail; change password in Privacy settings |
| Public | `/pricing`, `/about`, `/legal/*`, `/open-data`, `/verify/[serial]`, `/unsubscribe` | Plans from the API, legal texts in ru/kk/en, CSV open data, certificate check |

Retired URLs (`/guardian`, `/graph`, `/notifications`, `/lookup`, `/second-opinion`) redirect to their new homes.

---

## 3. Design system

Tokens live in `src/app/globals.css` (Tailwind v4 `@theme`); `/design-system` is a living style guide (development only).

- **Palette:** steppe-night teal, flag azure, sun gold. Risk colours are never alone — each band has an icon and a word.
- **Four modes:** dark (default), light, **high contrast** (`data-contrast="more"`, also follows `prefers-contrast`), **senior**
  (`data-density="comfortable"`: 18 px base, larger targets). Every token pair is checked for contrast and for the
  three common colour-vision deficiencies (`npm run tokens:check`, enforced in CI).
- **Type:** Inter (text), Unbounded (h1), JetBrains Mono (identifiers) — self-hosted by `next/font`, with the Kazakh letters
  ә ғ қ ң ө ұ ү һ і. Licences: [`../QorgauAI/docs/LICENSES.md`](../QorgauAI/docs/LICENSES.md).
- **Ornament:** a қошқар мүйіз (ram's horn) motif used sparingly as a divider and empty-state accent.
- **Voice:** plain, calm, no scare tactics, no unverifiable numbers — statistics come from `src/config/facts.ts` with a
  source and date, and only verified facts render.

---

## 4. Architecture

```
src/
  middleware.ts                 per-request CSP nonce
  app/                          routes (server components by default)
    (app)/                      authenticated shell: check, radar, learn, family, partner/*, settings/*, admin/moderation …
    api/session/route.ts        sign-in → httpOnly cookies
    backend/[...path]/route.ts  same-origin proxy: adds the Bearer token, shares one refresh rotation between parallel calls
  lib/
    api/                        generated schema.d.ts, openapi-fetch client, one TanStack Query hook per use case, SSE helper
    auth/  consent.ts  csp.ts  nav.ts  kz.ts (regions)  age.ts  push.ts  risk.ts  …
    i18n/                       next-intl, cookie locale: ru (default), kk, en — all complete
  components/                   ui/ (Radix-based), check/, risk/, radar/, family/, learn/, partner/, layout/, brand/, pwa/
  content/                      legal texts (ru/kk/en), teaching exercises
  messages/{ru,kk,en}.json      checked by Vitest: same keys, same placeholders, no dots in keys, no raw "<"
public/sw.js  manifest.webmanifest  icons/
tests/e2e/                      Playwright specs by area (compliance, check-v2, community, family-learning, partner, a11y-keyboard, audit, i18n …)
```

- **Typed end to end:** the client is generated from the backend's OpenAPI (`npm run gen:api`); there are no hand-written response types.
- **Auth:** the JWT and refresh token are httpOnly cookies. The browser only talks to `/backend/*`; the proxy attaches the token and
  rotates the refresh token once even when a page fires many requests at the same moment.
- **Consent first:** non-essential cookies, analytics and push are off until the visitor opts in; the banner has equal-weight buttons.
- **Message text is never sent to analytics** and never put in a URL.

---

## 5. Quality bars

- **Accessibility:** `audit.spec.ts` runs axe (WCAG 2.2 A/AA) over every screen in dark and light, desktop and mobile, and fails on any
  serious/critical issue or console error. `a11y-keyboard.spec.ts` covers the skip link, focus order, the palette and shortcuts.
- **Languages:** `i18n.spec.ts` fails if Cyrillic appears in the English UI; Vitest fails if the three message files drift apart.
- **Security:** CSP with a per-request nonce (no inline scripts in production), `X-Frame-Options: DENY`, strict referrer policy;
  report text is rendered as text only.
- **PWA:** installable (`manifest.webmanifest`, maskable icons, share target `Share → QorgauAI` prefills the check box without sending it),
  the service worker caches only `/golden-hour`, `/offline` and static assets — never API calls.
- **Performance** (Lighthouse mobile, simulated Slow 4G + 4× CPU, production build): accessibility, best practices and SEO are at the
  top of the scale; performance is lower than the 90 target on pages with a lot of client JS — see the table in the changelog for the
  numbers and the reasons. Real-device LCP on a normal connection is about 1.4 s.

---

## 6. Related docs

[`docs/demo-script.md`](../QorgauAI/docs/demo-script.md) (walkthrough of the new flow) ·
[`COMPLIANCE.md`](../QorgauAI/docs/COMPLIANCE.md) · [`DATA-INVENTORY.md`](../QorgauAI/docs/DATA-INVENTORY.md) ·
[`THIRD-PARTY.md`](../QorgauAI/docs/THIRD-PARTY.md) · [`design/contrast.md`](../QorgauAI/docs/design/contrast.md)
