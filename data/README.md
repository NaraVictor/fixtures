# Dummy data

This directory holds static JSON used when the app runs **without** Supabase. Shapes mirror the database schema so the same UI can later be wired to the backend.

## Files

- **leagues.json** – Leagues (id, name, slug, country, is_active).
- **teams.json** – Teams (id, league_id, name, short_name, slug).
- **fixtures.json** – Fixtures (slug format: `{league_slug}-{home_slug}-vs-{away_slug}-{YYYYMMDD}`).
- **predictions.json** – Predictions (fixture_id, prediction_type, predicted_value, confidence_score 0–1, status, frontier_explanation, etc.).
- **fixture-lineups.json** – Lineups per fixture (fixture_id, team_id, formation).
- **fixture-absences.json** – Absences per fixture (fixture_id, team_id, player_name_or_id, absence_type, impact_level).

## Data layer

`lib/data/dummy.ts` reads these files and exposes the same API used by the pages. When reconnecting Supabase, add `lib/data/supabase.ts` and switch `lib/data/index.ts` to export from there instead.
