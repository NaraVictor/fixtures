# Archive: 2025-02-25

Date-based snapshot of the Fixtures app before the lean/Gemini-only refactor.

## Design & architecture (at archive time)

- **Stack:** Next.js (App Router), Supabase (Postgres, Auth), Vercel (cron).
- **Data:** Adapter pattern (CSV + optional API-Football); teams/fixtures normalized; predictions reference fixtures by id.
- **Selection:** Ranking scorer (xG, form, h2h, home advantage, shots on target, lineup, key man) chose top N fixtures; local ML stub (rule-based 1x2) produced picks; optional frontier LLM (OpenAI/Anthropic) for explanations.
- **Automation:** Vercel Cron for daily picks and 4-hour result updates.
- **Public UI:** Home (predictions list + filters + betslip), fixture detail by slug. **Office:** Auth-protected admin (dashboard, teams, config, CSV import).

## What was archived

| Area | Contents |
|------|----------|
| **UI** | Office (dashboard, teams, config, import, login), BetslipConfigurator, HomeFilters |
| **API** | `/api/betslip`, `/api/cron/daily-picks`, `/api/cron/update-results`, `/api/office/*`, `/api/teams`, `/api/leagues` |
| **Lib** | `lib/ranking` (scorer), `lib/ml` (inference), `lib/llm` (frontier), `lib/data` (adapter, csv, import, league-map), `lib/auth` (secure-compare), `lib/analysis.ts` (Gemini script; requires @google/generative-ai, dotenv) |
| **Scripts** | `scripts/train-model.ts` |
| **Docs** | `docs/AUDIT.md` |
| **Config** | Root `middleware.ts` (office protection), `vercel.json` crons |

## What was kept in main app

- **Routes:** Home (`/`), Fixture detail (`/fixture/[slug]`).
- **Lib:** `lib/supabase` (client, server), `lib/analysis.ts`, `lib/index.ts`.
- **DB:** Existing Supabase schema (leagues, teams, fixtures, predictions, etc.) unchanged. Types are now derived from `supabase/config/tables.json` as the single source of truth.

## Restoring

Copy desired files from `archive/2025-02-25/` back into the project root. Restore `middleware.ts` and cron entries in `vercel.json` if you need office or cron again.
