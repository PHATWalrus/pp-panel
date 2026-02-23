This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run the main site:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) for the visitor-facing iCloud Digital Legacy flow.

Run the pp banging panel (operator dashboard) in a separate terminal:

```bash
cd panel && bun run dev
```

Open [http://localhost:3001](http://localhost:3001) for the panel. Set `NEXT_PUBLIC_MAIN_SITE_URL=http://localhost:3000` in `panel/.env.local` so the panel can reach the main site's tRPC API.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment

**Main site** (`.env.local`):

- `DATABASE_URL` - PostgreSQL connection string.
- `INTAKE_PAGE_ID` - Intake page id used by middleware checks.
- `INTAKE_PAGE_NAME` - Intake page display/source name for created targets.
- `OWNER_GROUP_ID` - Owner group id attached to new targets.

**Panel** (`panel/.env.local`):

- `NEXT_PUBLIC_MAIN_SITE_URL` - Main site URL (e.g. `http://localhost:3000`).
- `SESSION_SECRET` - Secret for encrypting panel session cookie.
- `DATABASE_URL` - Same PostgreSQL URL (panel uses root Prisma schema).

**Seed operator** (for panel login):

```bash
PANEL_ADMIN_EMAIL=admin@example.com PANEL_ADMIN_PASSWORD=changeme bun run db:seed
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
