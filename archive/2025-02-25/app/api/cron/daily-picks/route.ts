import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { scoreFixture } from "@/lib/ranking/scorer";
import { predict1x2, getModelVersion } from "@/lib/ml/inference";
import { getFrontierExplanation } from "@/lib/llm/frontier";
import { secureCompare } from "@/lib/auth/secure-compare";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !secureCompare(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data: config } = await supabase.from("ranking_config").select("weights").eq("is_active", true).single();
    const configWeights = (config?.weights as Record<string, unknown>) ?? {};
    const weights = Object.fromEntries(
      Object.entries(configWeights).filter(([, v]) => typeof v === "number") as [string, number][]
    ) as Record<string, number>;
    const numPicks = Math.min(20, Math.max(1, Number(configWeights.num_picks) || 10));
    const minOdds = typeof configWeights.min_odds === "number" ? configWeights.min_odds : null;
    const maxOdds = typeof configWeights.max_odds === "number" ? configWeights.max_odds : null;

    const { data: fixtures, error: fe } = await supabase
      .from("fixtures")
      .select("id, slug, league_id, home_team_id, away_team_id, fixture_date, status, home_goals, away_goals")
      .eq("fixture_date", today)
      .in("status", ["scheduled", "live"]);
    if (fe) throw fe;
    if (!fixtures?.length) {
      return NextResponse.json({ ok: true, message: "No fixtures today", picks: 0 });
    }

    const withStats = await Promise.all(
      fixtures.map(async (f) => {
        const [statsRes, lineupsRes, oddsRes] = await Promise.all([
          supabase.from("fixture_stats").select("xg_home, xg_away, shots_on_target_home, shots_on_target_away").eq("fixture_id", f.id).single(),
          supabase.from("fixture_lineups").select("id").eq("fixture_id", f.id),
          supabase.from("odds").select("market_type, outcome_label, odds_value").eq("fixture_id", f.id).order("captured_at", { ascending: false }).limit(10),
        ]);
        const odds = (oddsRes.data ?? []) as Array<{ market_type: string; outcome_label: string; odds_value: number }>;
        const odds1x2 = odds.filter((o) => o.market_type === "1x2" || o.market_type === "Match Result");
        let passesOdds = true;
        if ((minOdds != null || maxOdds != null) && odds1x2.length > 0) {
          const homeOdds = odds1x2.find((o) => /1|home/i.test(o.outcome_label))?.odds_value;
          if (homeOdds != null) {
            if (minOdds != null && homeOdds < minOdds) passesOdds = false;
            if (maxOdds != null && homeOdds > maxOdds) passesOdds = false;
          }
        }
        return {
          ...f,
          fixture_stats: statsRes.data,
          hasLineup: (lineupsRes.data?.length ?? 0) > 0,
          keyManAbsenceHome: false,
          keyManAbsenceAway: false,
          passesOdds,
        };
      })
    );

    const scored = withStats
      .filter((f) => f.passesOdds)
      .map((f) => ({ fixtureId: f.id, score: scoreFixture(f, weights) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, numPicks);

    const { data: run, error: runErr } = await supabase
      .from("prediction_runs")
      .insert({
        run_at: new Date().toISOString(),
        num_picks: top.length,
        criteria_snapshot: { ...weights, num_picks: numPicks, min_odds: minOdds, max_odds: maxOdds },
      })
      .select("id")
      .single();
    if (runErr) throw runErr;

    const modelVersion = getModelVersion();
    const fixtureDetails = await Promise.all(
      top.map(async ({ fixtureId }) => {
        const { data: fix } = await supabase
          .from("fixtures")
          .select("home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name), league:leagues(name)")
          .eq("id", fixtureId)
          .single();
        const h = (fix as { home_team?: { name: string } | { name: string }[] })?.home_team;
        const a = (fix as { away_team?: { name: string } | { name: string }[] })?.away_team;
        const l = (fix as { league?: { name: string } | { name: string }[] })?.league;
        return {
          fixtureId,
          homeTeam: Array.isArray(h) ? h[0]?.name : h?.name,
          awayTeam: Array.isArray(a) ? a[0]?.name : a?.name,
          league: Array.isArray(l) ? l[0]?.name : l?.name,
        };
      })
    );

    for (let i = 0; i < top.length; i++) {
      const { fixtureId } = top[i];
      const score = top[i].score;
      const pred = predict1x2(score);
      const detail = fixtureDetails[i];
      let frontierExplanation: string | null = null;
      if (i < 3 && (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)) {
        frontierExplanation = await getFrontierExplanation({
          homeTeam: detail?.homeTeam ?? "Home",
          awayTeam: detail?.awayTeam ?? "Away",
          league: detail?.league ?? "",
          predictionType: "1x2",
          predictedValue: pred.recommended,
          confidenceScore: score,
          localSummary: `Model: ${pred.model_version}, P(1)=${(pred.probabilities["1"] * 100).toFixed(0)}%`,
        });
      }
      await supabase.from("predictions").insert({
        fixture_id: fixtureId,
        prediction_run_id: run?.id,
        prediction_type: "1x2",
        predicted_value: pred.recommended,
        confidence_score: score,
        model_version: modelVersion,
        local_model_output: {
          recommended: pred.recommended,
          probabilities: pred.probabilities,
          model_version: pred.model_version,
        },
        frontier_explanation: frontierExplanation,
        status: "pending",
      });
    }
    return NextResponse.json({ ok: true, picks: top.length, runId: run?.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
