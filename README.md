# Dedy Command Center

Production-ready personal web app foundation built with Next.js App Router, TypeScript, Tailwind CSS, ESLint, and Prettier.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- ESLint
- Prettier (+ Tailwind plugin)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Run development server:

```bash
npm run dev
```

Open `http://localhost:3000` and you will be redirected to `/dashboard`.

## Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run format` - format with Prettier
- `npm run format:check` - verify formatting
