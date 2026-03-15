import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateContentWithRetry } from "@/lib/ai";

export async function POST() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_AI_API_KEY is not set" },
        { status: 500 },
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your env to allow writes from admin routes.",
        },
        { status: 500 },
      );
    }

    const supabase = createServiceClient();

    // 1. Find fixtures that likely finished but don't have results yet
    const today = new Date().toISOString().slice(0, 10);
    const { data: fixtures, error: fixturesError } = await supabase
      .from("fixtures")
      .select(
        "id, slug, fixture_date, status, home_goals, away_goals, home_team:teams!fixtures_home_team_id_fkey(name), away_team:teams!fixtures_away_team_id_fkey(name), league:leagues(name)",
      )
      .lte("fixture_date", today)
      .in("status", ["scheduled", "live"])
      .limit(50);
    if (fixturesError) throw fixturesError;
    if (!fixtures?.length) {
      return NextResponse.json({
        ok: true,
        message: "No fixtures needing updates.",
        updatedFixtures: 0,
        updatedPredictions: 0,
      });
    }

    const fixtureIds = fixtures.map((f) => f.id);

    // 2. Pending predictions for those fixtures
    const { data: pendingPreds, error: predsError } = await supabase
      .from("predictions")
      .select("id, fixture_id, prediction_type, predicted_value")
      .in("fixture_id", fixtureIds)
      .eq("status", "pending");
    if (predsError) throw predsError;

    // 3. Ask AI for results and prediction grading
    const name = (x: { name?: string } | { name?: string }[] | null) =>
      x == null ? undefined : Array.isArray(x) ? x[0]?.name : x.name;

    const prompt = JSON.stringify({
      fixtures: fixtures.map((f) => ({
        id: f.id,
        slug: f.slug,
        fixture_date: f.fixture_date,
        league: name(f.league as { name?: string } | { name?: string }[] | null),
        home_team: name(f.home_team as { name?: string } | { name?: string }[] | null),
        away_team: name(f.away_team as { name?: string } | { name?: string }[] | null),
      })),
      predictions: pendingPreds ?? [],
    });

    const genResult = await generateContentWithRetry(
      apiKey,
      [
        "You are updating football fixtures and grading predictions.",
        "For each fixture, return final score and status.",
        "For each prediction, return status: correct, incorrect, or void, plus actual_result with goals.",
        "Respond with pure JSON only in this shape:",
        `{"fixtures":[{"fixture_id":"uuid","home_goals":1,"away_goals":0,"status":"finished"}],"predictions":[{"prediction_id":"uuid","status":"correct","actual_result":{"home_goals":1,"away_goals":0}}]}`,
        `DATA: ${prompt}`,
      ],
    );
    if (!genResult.ok) {
      return NextResponse.json(
        {
          error: genResult.error,
          ...(genResult.retryAfter != null && {
            retryAfterSeconds: genResult.retryAfter,
          }),
        },
        { status: genResult.status },
      );
    }

    const raw = genResult.text;
    const text = raw.replace(/```json|```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI response was not valid JSON", raw },
        { status: 502 },
      );
    }

    const fixturesUpdates = Array.isArray(parsed.fixtures)
      ? parsed.fixtures
      : [];
    const predictionUpdates = Array.isArray(parsed.predictions)
      ? parsed.predictions
      : [];

    let updatedFixtures = 0;
    for (const f of fixturesUpdates) {
      if (!f.fixture_id) continue;
      await supabase
        .from("fixtures")
        .update({
          status: f.status ?? "finished",
          home_goals: f.home_goals,
          away_goals: f.away_goals,
        })
        .eq("id", f.fixture_id);
      updatedFixtures++;
    }

    let updatedPredictions = 0;
    for (const p of predictionUpdates) {
      if (!p.prediction_id) continue;
      await supabase
        .from("predictions")
        .update({
          status: p.status,
          actual_result: p.actual_result ?? null,
        })
        .eq("id", p.prediction_id);
      updatedPredictions++;
    }

    return NextResponse.json({
      ok: true,
      message: "Fixtures and predictions updated from Gemini response.",
      updatedFixtures,
      updatedPredictions,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message ?? String(error) },
      { status: 500 },
    );
  }
}

