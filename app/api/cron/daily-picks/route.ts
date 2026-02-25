import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { scoreFixture } from "@/lib/ranking/scorer";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data: fixtures, error: fe } = await supabase
      .from("fixtures")
      .select("id, slug, league_id, home_team_id, away_team_id, fixture_date, status, home_goals, away_goals")
      .eq("fixture_date", today)
      .in("status", ["scheduled", "live"]);
    if (fe) throw fe;
    if (!fixtures?.length) {
      return NextResponse.json({ ok: true, message: "No fixtures today", picks: 0 });
    }
    const { data: config } = await supabase.from("ranking_config").select("weights").eq("is_active", true).single();
    const weights = (config?.weights as Record<string, number>) ?? {};
    const withStats = await Promise.all(
      fixtures.map(async (f) => {
        const { data: stats } = await supabase.from("fixture_stats").select("xg_home, xg_away, shots_on_target_home, shots_on_target_away").eq("fixture_id", f.id).single();
        const { data: lineups } = await supabase.from("fixture_lineups").select("id").eq("fixture_id", f.id);
        return {
          ...f,
          fixture_stats: stats,
          hasLineup: (lineups?.length ?? 0) > 0,
          keyManAbsenceHome: false,
          keyManAbsenceAway: false,
        };
      })
    );
    const scored = withStats.map((f) => ({ fixtureId: f.id, score: scoreFixture(f, weights) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 10);
    const { data: run, error: runErr } = await supabase
      .from("prediction_runs")
      .insert({ run_at: new Date().toISOString(), num_picks: top.length, criteria_snapshot: weights })
      .select("id")
      .single();
    if (runErr) throw runErr;
    for (const { fixtureId } of top) {
      await supabase.from("predictions").insert({
        fixture_id: fixtureId,
        prediction_run_id: run?.id,
        prediction_type: "1x2",
        predicted_value: "1",
        confidence_score: scored.find((s) => s.fixtureId === fixtureId)?.score ?? 0.5,
        status: "pending",
      });
    }
    return NextResponse.json({ ok: true, picks: top.length, runId: run?.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
