export type FixtureStatus = "scheduled" | "live" | "finished";
export type PredictionStatus = "pending" | "correct" | "incorrect" | "void";

export interface League {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  api_external_id: string | null;
  is_active: boolean;
}

export interface Team {
  id: string;
  league_id: string | null;
  name: string;
  short_name: string | null;
  slug: string;
  api_external_id: string | null;
}

export interface Fixture {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  slug: string;
  started_at: string | null;
  ended_at: string | null;
  fixture_date: string;
  status: FixtureStatus;
  home_goals: number | null;
  away_goals: number | null;
  half_time_home: number | null;
  half_time_away: number | null;
  venue: string | null;
  raw_metadata: Record<string, unknown> | null;
  home_team?: Team;
  away_team?: Team;
  league?: League;
}

export interface Prediction {
  id: string;
  fixture_id: string;
  status: PredictionStatus;
  prediction_type: string;
  predicted_value: string;
  confidence_score: number | null;
  frontier_explanation: string | null;
  fixture?: Fixture;
}

export interface FixtureWithTeams extends Fixture {
  home_team: Team;
  away_team: Team;
  league: League;
}

export interface RankingWeights {
  xg_weight?: number;
  form_weight?: number;
  h2h_weight?: number;
  home_advantage_weight?: number;
  shots_on_target_weight?: number;
  lineup_weight?: number;
  key_man_weight?: number;
}
