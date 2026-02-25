import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

type PredictionRow = {
  id: string;
  fixture_id: string;
  prediction_type: string;
  predicted_value: string;
  confidence_score: number | null;
  fixture: {
    id: string;
    slug: string;
    fixture_date: string;
    league: { slug: string } | null;
    home_team: { name: string } | null;
    away_team: { name: string } | null;
  };
};

const MARKET_TYPES = ["1x2", "over_under_2.5"] as const;

function outcomeLabelsForValue(value: string, marketType: string): string[] {
  if (marketType === "1x2") return [value];
  if (marketType === "over_under_2.5") {
    const v = value.toLowerCase();
    if (v === "over") return ["over", "Over 2.5", "Over"];
    if (v === "under") return ["under", "Under 2.5", "Under"];
    return [value];
  }
  return [value];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const totalOddsTarget = Math.max(
    1.01,
    Math.min(1000, Number(searchParams.get("totalOdds")) || 5),
  );
  const leaguesParam = searchParams.get("leagues");
  const leagueSlugs = leaguesParam
    ? leaguesParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  const marketTypeParam = searchParams.get("marketType") || "1x2";
  const marketType = MARKET_TYPES.includes(
    marketTypeParam as (typeof MARKET_TYPES)[number],
  )
    ? marketTypeParam
    : "1x2";
  const maxLegs = Math.max(
    1,
    Math.min(20, Number(searchParams.get("maxLegs")) || 10),
  );
  const rawDate =
    searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10);
  const date = dateMatch;

  const supabase = createClient(await cookies());

  const { data: predictions, error: predErr } = await supabase
    .from("predictions")
    .select(
      "id, fixture_id, prediction_type, predicted_value, confidence_score, fixture:fixtures(id, slug, fixture_date, home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name), league:leagues(slug))",
    )
    .eq("status", "pending")
    .eq("prediction_type", marketType);

  if (predErr)
    return NextResponse.json({ error: predErr.message }, { status: 500 });
  const list = (predictions ?? []) as unknown as PredictionRow[];
  let filtered = list.filter((p) => p.fixture?.fixture_date === date);
  if (leagueSlugs?.length) {
    filtered = filtered.filter(
      (p) =>
        p.fixture?.league?.slug && leagueSlugs.includes(p.fixture.league.slug),
    );
  }

  const fixtureIds = Array.from(new Set(filtered.map((p) => p.fixture_id)));
  const { data: oddsRows } = await supabase
    .from("odds")
    .select("fixture_id, market_type, outcome_label, odds_value")
    .in("fixture_id", fixtureIds)
    .eq("market_type", marketType);

  const oddsByFixtureAndOutcome = new Map<string, number>();
  for (const o of oddsRows ?? []) {
    const key = `${o.fixture_id}:${(o.outcome_label ?? "").trim().toLowerCase()}`;
    oddsByFixtureAndOutcome.set(key, Number(o.odds_value));
  }

  const candidates = filtered.map((p) => {
    const labels = outcomeLabelsForValue(p.predicted_value, marketType);
    let oddsValue: number | undefined;
    for (const label of labels) {
      oddsValue = oddsByFixtureAndOutcome.get(
        `${p.fixture_id}:${label.toLowerCase()}`,
      );
      if (oddsValue != null) break;
    }
    if (oddsValue == null || oddsValue < 1) {
      const conf = p.confidence_score ?? 0.5;
      oddsValue = Math.max(1.01, Math.min(20, 1 / conf));
    }
    return {
      prediction: p,
      oddsValue,
      confidence: p.confidence_score ?? 0,
    };
  });

  candidates.sort((a, b) => b.confidence - a.confidence);

  let combined = 1;
  const picks: typeof candidates = [];
  for (const c of candidates) {
    if (picks.length >= maxLegs) break;
    if (combined * c.oddsValue >= totalOddsTarget * 0.95) {
      picks.push(c);
      combined *= c.oddsValue;
      break;
    }
    picks.push(c);
    combined *= c.oddsValue;
  }

  return NextResponse.json({
    picks: picks.map(({ prediction, oddsValue }) => ({
      predictionId: prediction.id,
      fixtureId: prediction.fixture_id,
      slug: prediction.fixture?.slug,
      homeTeam: prediction.fixture?.home_team?.name ?? "Home",
      awayTeam: prediction.fixture?.away_team?.name ?? "Away",
      league: (prediction.fixture?.league as { slug?: string })?.slug ?? "",
      fixtureDate: prediction.fixture?.fixture_date,
      marketType: prediction.prediction_type,
      predictedValue: prediction.predicted_value,
      confidenceScore: prediction.confidence_score,
      oddsValue,
    })),
    combinedOdds: picks.length
      ? picks.reduce((acc, c) => acc * c.oddsValue, 1)
      : 0,
    totalOddsTarget,
    maxLegs,
  });
}
