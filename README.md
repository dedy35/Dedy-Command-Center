# Dedy Command Center

Production-ready personal web app foundation built with Next.js App Router, TypeScript, Tailwind CSS, ESLint, Prettier, Docker Compose, PostgreSQL, and Prisma.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- ESLint
- Prettier (+ Tailwind plugin)
- PostgreSQL + Prisma ORM
- Docker Compose

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Start PostgreSQL:

```bash
docker compose up -d db
```

4. Run migration and seed:

```bash
npm run db:migrate
npm run db:seed
```

5. Run development server:

```bash
npm run dev
```

Open `http://localhost:3000` and sign in with:

- Email: `AUTH_EMAIL` in your `.env.local`
- Password: `AUTH_PASSWORD` in your `.env.local`

## Authentication & Security

- Single-user authentication is enforced with JWT httpOnly cookie session (`dcc_session`).
- Middleware protects all app routes and private APIs from unauthenticated access.
- Admin audit log page: `/admin/audit-logs`.

## Audited Action Endpoints

All mutable/action-sensitive operations below write to `audit_logs`:

- `POST /api/tags` (`create`)
- `PUT /api/tags` (`update`)
- `DELETE /api/tags` (`delete`)
- `POST /api/approvals/[id]/decision` (`approve`)
- `POST /api/export` (`export`)
- `POST /api/ai/run` (`ai_run`)

## Local Database With Docker Compose

Run full app + DB stack with Docker:

```bash
docker compose up -d
```

## Scripts

- `npm run dev` - start local development server
- `npm run dev:docker` - run dev server bound for Docker network
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run format` - format with Prettier
- `npm run format:check` - verify formatting
- `npm run db:generate` - generate Prisma Client
- `npm run db:migrate` - create/apply development migrations
- `npm run db:migrate:deploy` - apply migrations in deploy mode
- `npm run db:seed` - seed initial data
- `npm run db:studio` - open Prisma Studio
