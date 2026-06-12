# ETCODE 4 — registration website

A two-part site for **ETCODE 4**, a competitive programming contest
by **ENSIA Tech Community**. Landing page + a three-path registration flow
(Create Team / Join Team / Solo) backed by Supabase.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase ·
Motion · Lenis.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm run build` / `npm run start` for production, `npm run lint` for eslint.

## Supabase setup (registration)

The forms validate without keys, but writes need Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL editor** and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates the `teams` and `participants` tables, the atomic `join_team`
   RPC (enforces the 3-player cap), and locks the tables behind RLS.
3. In **Project settings → API**, copy the values into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
   SUPABASE_SERVICE_ROLE_KEY=<service role secret>
   ```

   The **service-role key is server-only** — it's used solely by Server Actions
   (`lib/actions.ts`) and never reaches the browser. Never prefix it with
   `NEXT_PUBLIC_`.

4. Restart `npm run dev`.

## Security posture

- **SQL injection** — all DB access goes through the Supabase client (parameterized
  queries) and the `join_team` RPC (parameterized `jsonb`). No string-built SQL.
- **CSRF** — registration writes are Next.js **Server Actions**, which are
  origin-checked by the framework; no custom endpoints are exposed.
- **Service-role isolation** — the service-role key is `server-only` and used
  solely in `lib/actions.ts`. RLS denies the anon key direct table access.
- **Validation twice** — zod on the client (RHF resolver) and again in every
  action. Inputs are trimmed and length-capped.
- **Rate limiting** — per-IP sliding window in `lib/rate-limit.ts` (create/join/
  solo/verify). In-memory + best-effort; back it with Upstash Redis for
  multi-instance production.
- **Bot trap** — a hidden honeypot field; submissions that fill it are silently
  dropped.

## Editing content

All copy and data live in **`lib/content.ts`** (event facts, stats, format,
agenda, mentors, FAQ, prizes, sponsors). When the real date/venue/lineup arrive,
only this file changes. Registration fields live in `lib/schema.ts` — change a
field there **and** in `supabase/schema.sql` together.
