# Tenmeya Landing Page Builder

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design (template engine, database schema, JSON content schema, component hierarchy, folder structure, and rationale). This README only covers running what's built so far (Phase 1).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · shadcn-style components (hand-vendored, see note below) · Supabase (Postgres + Auth + Storage) · TanStack Query · React Hook Form + Zod

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's URL + anon key
```

Apply the schema to your Supabase project (SQL editor, or `supabase db push` if you have the CLI linked):

```
supabase/migrations/0001_init.sql
supabase/seed.sql
```

```bash
npm run dev
```

## What exists today (Phase 1)

- Project scaffold, design system tokens (`app/globals.css`, `components/design-system/`), hand-vendored UI primitives (`components/ui/`)
- Supabase wiring: browser/server clients (`lib/supabase/`), full DB schema + RLS (`supabase/migrations/0001_init.sql`)
- Auth: email/password login/signup via Server Actions (`app/(auth)/`), session refresh + optimistic route guards in `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`), real authorization checks in the Data Access Layer (`lib/auth/dal.ts`)
- Minimal dashboard/admin shells, and placeholder public routes (`/[handle]`, `/preview/[slug]`) that prove the data lookups but don't render a template yet — that's Phase 2.

## Note on shadcn/ui

`ui.shadcn.com` isn't reachable from this environment's sandbox, so `components/ui/*` were hand-written using the same open-source component patterns the CLI would generate, rather than run through `npx shadcn add`. If you have CLI access, `npx shadcn@latest add <component>` should still work going forward and will slot in alongside these.
