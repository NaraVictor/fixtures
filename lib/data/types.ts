/** Shared types for dummy data and future Supabase. Mirror DB shapes. */

export type FixtureStatus = "scheduled" | "live" | "finished";
export type PredictionStatus = "pending" | "won" | "lost" | "void";

export interface League {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  is_active?: boolean;
}

export interface Team {
  id: string;
  league_id: string | null;
  name: string;
  short_name?: string | null;
  slug: string;
}

export interface Fixture {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  slug: string;
  fixture_date: string;
  started_at: string | null;
  ended_at: string | null;
  status: FixtureStatus;
  home_goals: number | null;
  away_goals: number | null;
  half_time_home: number | null;
  half_time_away: number | null;
  venue: string | null;
  raw_metadata: { referee?: string; weather?: string } | null;
}

export interface Prediction {
  id: string;
  fixture_id: string;
  status: PredictionStatus;
  prediction_type: string;
  predicted_value: string;
  confidence_score: number | null;
  frontier_explanation: string | null;
  model_version: string | null;
  local_model_output: Record<string, unknown> | null;
  created_at: string;
}

export interface FixtureLineup {
  fixture_id: string;
  team_id: string;
  formation: string | null;
  full_line?: string[] | null;
}

export interface FixtureAbsence {
  fixture_id: string;
  team_id: string;
  player_name_or_id: string | null;
  absence_type: string;
  impact_level: string;
}

export interface LeagueStanding {
  league_id: string;
  team_id: string;
  position: number;
}

/** Joined prediction with fixture + teams + league for list views */
export interface PredictionWithFixture {
  id: string;
  status: PredictionStatus;
  prediction_type: string;
  predicted_value: string;
  confidence_score: number | null;
  frontier_explanation: string | null;
  created_at: string;
  fixture: Fixture & {
    home_team: Team | null;
    away_team: Team | null;
    league: League | null;
  };
}
