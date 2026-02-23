# Deploying on Coolify

Deploy both the main site and pp banging panel from this repo as two separate Coolify applications. Each uses Nixpacks with Bun and Node.js 22.

## Prerequisites

- Coolify instance running
- PostgreSQL database (can be Coolify-managed or external)
- Git repository (GitHub, GitLab, etc.) connected to Coolify

---

## 1. Main Site (iCloud Digital Legacy flow)

Create a new **Application** in Coolify:

| Setting | Value |
|---------|-------|
| **Source** | Your Git repo |
| **Base Directory** | `.` (repository root) |
| **Build Pack** | Nixpacks |
| **Port** | `3000` |
| **Watch Paths** | `app/**`, `prisma/**`, `middleware.js`, `next.config.mjs`, `package.json`, `bun.lock`, `nixpacks.toml` |

### Environment variables

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
INTAKE_PAGE_ID=<your-intake-page-id>
INTAKE_PAGE_NAME=iCloud
OWNER_GROUP_ID=<optional>
```

### Notes

- Nixpacks reads `nixpacks.toml` at the repo root
- Build runs `bunx prisma generate` then `bun run build`
- Start command: `bun run start` (Next.js on port 3000)

---

## 2. pp banging panel (operator dashboard)

Create a second **Application** in Coolify:

| Setting | Value |
|---------|-------|
| **Source** | Same Git repo as main site |
| **Base Directory** | `panel` |
| **Build Pack** | Nixpacks |
| **Port** | `3001` |
| **Watch Paths** | `panel/**` |

### Environment variables

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXT_PUBLIC_MAIN_SITE_URL=https://your-main-site.com
SESSION_SECRET=<random-secret-for-session-cookie>
```

### Notes

- **Base Directory = `panel`** makes Coolify treat `panel/` as the app root
- Nixpacks finds `panel/nixpacks.toml` automatically
- `NEXT_PUBLIC_MAIN_SITE_URL` must be your main site’s public URL (e.g. `https://app.example.com`) so the panel can call its tRPC API
- Panel runs on port 3001

---

## 3. Database

Both apps share the same database:

1. Create a PostgreSQL instance (Coolify or external).
2. Run migrations if needed: `bunx prisma migrate deploy` (from root) or seed the panel operator:
   ```bash
   PANEL_ADMIN_EMAIL=admin@example.com PANEL_ADMIN_PASSWORD=changeme bun run db:seed
   ```
3. Use the same `DATABASE_URL` for both applications.

---

## 4. Domains & networking

- **Main site**: e.g. `https://app.example.com` → proxy to main app (port 3000)
- **Panel**: e.g. `https://panel.example.com` → proxy to panel app (port 3001)

Configure domains in Coolify for each application.

---

## 5. Summary

| App | Base Dir | Port | Config |
|-----|----------|------|--------|
| Main site | `.` | 3000 | Root `nixpacks.toml` |
| Panel | `panel` | 3001 | `panel/nixpacks.toml` |

Both use Nixpacks, Bun, and Node.js 22. Watch paths limit redeploys to the app that changed.
