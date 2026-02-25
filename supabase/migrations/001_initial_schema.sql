-- Leagues
create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text,
  api_external_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Teams (reference for all predictions/fixtures)
create table teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id),
  name text not null,
  short_name text,
  slug text not null,
  api_external_id text,
  created_at timestamptz not null default now(),
  unique(league_id, slug)
);

create index teams_league_slug on teams(league_id, slug);
create index teams_slug on teams(slug);

-- Fixtures (started_at, ended_at, slug)
create table fixtures (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id),
  home_team_id uuid not null references teams(id),
  away_team_id uuid not null references teams(id),
  slug text not null unique,
  started_at timestamptz,
  ended_at timestamptz,
  fixture_date date not null,
  status text not null default 'scheduled' check (status in ('scheduled','live','finished')),
  home_goals int,
  away_goals int,
  half_time_home int,
  half_time_away int,
  venue text,
  api_external_id text,
  raw_metadata jsonb,
  season text,
  matchday int,
  created_at timestamptz not null default now()
);

create index fixtures_slug on fixtures(slug);
create index fixtures_status_ended on fixtures(status, ended_at);
create index fixtures_league_date on fixtures(league_id, fixture_date);
create index fixtures_date on fixtures(fixture_date);

-- Fixture stats (optional)
create table fixture_stats (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  xg_home numeric,
  xg_away numeric,
  shots_on_target_home int,
  shots_on_target_away int,
  corners_home int,
  corners_away int,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique(fixture_id)
);

-- Lineups / formations (realtime)
create table fixture_lineups (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  team_id uuid not null references teams(id),
  formation text,
  source text,
  raw_metadata jsonb,
  captured_at timestamptz not null default now()
);

create index fixture_lineups_fixture on fixture_lineups(fixture_id);

-- Absences (key man)
create table fixture_absences (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  team_id uuid not null references teams(id),
  player_name_or_id text,
  absence_type text check (absence_type in ('injury','suspension','rest','international')),
  impact_level text check (impact_level in ('key','high','medium','low')),
  source text,
  captured_at timestamptz not null default now()
);

create index fixture_absences_fixture on fixture_absences(fixture_id);

-- Odds
create table odds (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  source text not null,
  market_type text not null,
  outcome_label text,
  odds_value numeric not null,
  captured_at timestamptz not null default now()
);

create index odds_fixture on odds(fixture_id);

-- Prediction runs
create table prediction_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  league_ids uuid[],
  num_picks int,
  criteria_snapshot jsonb
);

-- Predictions
create table predictions (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  prediction_run_id uuid references prediction_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','correct','incorrect','void')),
  prediction_type text not null,
  predicted_value text not null,
  confidence_score numeric,
  model_version text,
  local_model_output jsonb,
  frontier_explanation text,
  actual_result jsonb
);

create index predictions_fixture_status on predictions(fixture_id, status);
create index predictions_status on predictions(status);

-- Ranking config (weights for scorer)
create table ranking_config (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default false,
  weights jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- RLS: public read for leagues, teams, fixtures, fixture_stats, odds, predictions, prediction_runs
alter table leagues enable row level security;
alter table teams enable row level security;
alter table fixtures enable row level security;
alter table fixture_stats enable row level security;
alter table fixture_lineups enable row level security;
alter table fixture_absences enable row level security;
alter table odds enable row level security;
alter table predictions enable row level security;
alter table prediction_runs enable row level security;
alter table ranking_config enable row level security;

create policy "Public read leagues" on leagues for select using (true);
create policy "Public read teams" on teams for select using (true);
create policy "Public read fixtures" on fixtures for select using (true);
create policy "Public read fixture_stats" on fixture_stats for select using (true);
create policy "Public read fixture_lineups" on fixture_lineups for select using (true);
create policy "Public read fixture_absences" on fixture_absences for select using (true);
create policy "Public read odds" on odds for select using (true);
create policy "Public read predictions" on predictions for select using (true);
create policy "Public read prediction_runs" on prediction_runs for select using (true);
create policy "Public read ranking_config" on ranking_config for select using (true);

-- Service role can do everything; anon is read-only. Office writes will use service role or a dedicated admin policy later.
comment on table leagues is 'Fixtures app: leagues (EPL, La Liga, etc.)';

insert into ranking_config (name, is_active, weights) values (
  'default',
  true,
  '{"xg_weight":0.15,"form_weight":0.2,"h2h_weight":0.1,"home_advantage_weight":0.1,"shots_on_target_weight":0.15,"lineup_weight":0.1,"key_man_weight":0.1}'::jsonb
);
