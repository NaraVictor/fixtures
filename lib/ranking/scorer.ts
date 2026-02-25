import type { RankingWeights } from "@/lib/db/types";

export interface ScoredFixture {
  fixtureId: string;
  score: number;
  hasLineup?: boolean;
  hasKeyManAbsence?: boolean;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  xg_weight: 0.15,
  form_weight: 0.2,
  h2h_weight: 0.1,
  home_advantage_weight: 0.1,
  shots_on_target_weight: 0.15,
  lineup_weight: 0.1,
  key_man_weight: 0.1,
};

export function scoreFixture(
  fixture: {
    id: string;
    home_goals?: number | null;
    away_goals?: number | null;
    fixture_stats?: { xg_home?: number; xg_away?: number; shots_on_target_home?: number; shots_on_target_away?: number } | null;
    hasLineup?: boolean;
    keyManAbsenceHome?: boolean;
    keyManAbsenceAway?: boolean;
  },
  weights: Partial<RankingWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  let score = 0.5;
  const xgHome = fixture.fixture_stats?.xg_home ?? fixture.home_goals ?? 0;
  const xgAway = fixture.fixture_stats?.xg_away ?? fixture.away_goals ?? 0;
  if (xgHome + xgAway > 0) {
    const xgNorm = Math.min(1, (xgHome + xgAway) / 4);
    score += xgNorm * (w.xg_weight ?? 0);
  }
  const sotHome = fixture.fixture_stats?.shots_on_target_home ?? 0;
  const sotAway = fixture.fixture_stats?.shots_on_target_away ?? 0;
  if (sotHome + sotAway > 0) {
    const sotNorm = Math.min(1, (sotHome + sotAway) / 20);
    score += sotNorm * (w.shots_on_target_weight ?? 0);
  }
  score += (w.home_advantage_weight ?? 0) * 0.5;
  if (fixture.hasLineup) score += w.lineup_weight ?? 0;
  if (fixture.keyManAbsenceAway && !fixture.keyManAbsenceHome) score += w.key_man_weight ?? 0;
  if (fixture.keyManAbsenceHome) score -= w.key_man_weight ?? 0;
  return Math.max(0, Math.min(1, score));
}
