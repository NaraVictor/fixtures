# Fixtures

AI-powered sports prediction app: daily picks, results, and admin.

## Stack

- **Next.js** (App Router), **Supabase** (Postgres, Auth), **Vercel** (cron)

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run migrations: `supabase db push` or run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
   - Copy project URL and anon key; create a service role key for cron/import.

3. **Env**
   - Copy `.env.local.example` to `.env.local`.
   - Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   - For cron (and optional import protection): `CRON_SECRET`.

4. **Data**
   - Place football-data.co.uk CSVs in `data/` (e.g. `2024-25 Season - E0.csv`).
   - In the app go to **Office → Import CSV** to load fixtures and teams.

5. **Run**
   ```bash
   npm run dev
   ```
   - Home: `http://localhost:3000`
   - Office: `http://localhost:3000/office`

## Cron (Vercel)

- **Daily picks**: `GET /api/cron/daily-picks` at 06:00 UTC. Header: `Authorization: Bearer <CRON_SECRET>`.
- **Update results**: `GET /api/cron/update-results` every 4 hours. Same header.

## Routes

- `/` – Public predictions list (filter by status).
- `/fixture/[slug]` – Fixture detail and predictions.
- `/office` – Admin (dashboard, teams, config, import). Auth to be added.
