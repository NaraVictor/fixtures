import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
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

    const [{ data: leagues, error: leaguesError }, { data: teams, error: teamsError }] =
      await Promise.all([
        supabase.from("leagues").select("id, name, slug").eq("is_active", true),
        supabase.from("teams").select("id, name, league_id"),
      ]);
    if (leaguesError) throw leaguesError;
    if (teamsError) throw teamsError;

    const skill = fs.readFileSync(
      path.join(process.cwd(), "skill.md"),
      "utf8",
    );
    const promptTemplate = fs.readFileSync(
      path.join(process.cwd(), "prompt.md"),
      "utf8",
    );

    const gameCount = 10;
    const systemInstruction = promptTemplate.replace(
      "{{n}}",
      gameCount.toString(),
    );

    const genResult = await generateContentWithRetry(
      apiKey,
      [
        `leagues_reference: ${JSON.stringify(leagues ?? [])}`,
        `teams_reference: ${JSON.stringify(teams ?? [])}`,
        `skill.md:\n${skill}`,
        `Task: Generate upcoming fixtures and predictions as per the response schemas (exact JSON, no extra text). Use fixture_slug in each prediction to reference a fixture in the same response.`,
      ],
      { systemInstruction },
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
        {
          error: "AI response was not valid JSON",
          raw,
        },
        { status: 502 },
      );
    }

    const rawFixtures = Array.isArray(parsed.fixtures) ? parsed.fixtures : [];
    const rawPredictions = Array.isArray(parsed.predictions)
      ? parsed.predictions
      : [];

    const leagueIds = new Set((leagues ?? []).map((l: { id: string }) => l.id));
    const teamIds = new Set((teams ?? []).map((t: { id: string }) => t.id));

    const fixtureRows = rawFixtures
      .filter(
        (f: any) =>
          f.league_id &&
          f.home_team_id &&
          f.away_team_id &&
          f.slug &&
          f.fixture_date &&
          leagueIds.has(f.league_id) &&
          teamIds.has(f.home_team_id) &&
          teamIds.has(f.away_team_id),
      )
      .map((f: any) => ({
        league_id: f.league_id,
        home_team_id: f.home_team_id,
        away_team_id: f.away_team_id,
        slug: String(f.slug).trim(),
        fixture_date: f.fixture_date,
        started_at: f.started_at ?? null,
        status: f.status ?? "scheduled",
        venue: f.venue ?? null,
      }));

    if (fixtureRows.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No valid fixtures to insert (missing or invalid IDs/slugs).",
        insertedFixtures: 0,
        insertedPredictions: 0,
      });
    }

    const { data: insertedFixtures, error: upsertFixturesError } = await supabase
      .from("fixtures")
      .upsert(fixtureRows, { onConflict: "slug", ignoreDuplicates: false })
      .select("id, slug");
    if (upsertFixturesError) throw upsertFixturesError;

    const slugToId = new Map<string, string>();
    for (const row of insertedFixtures ?? []) {
      slugToId.set(row.slug, row.id);
    }

    const predictionRows: Array<{
      fixture_id: string;
      prediction_type: string;
      predicted_value: string;
      confidence_score: number | null;
      frontier_explanation: string | null;
      status: string;
    }> = [];
    for (const p of rawPredictions) {
      const fixtureId =
        p.fixture_slug != null
          ? slugToId.get(String(p.fixture_slug).trim())
          : p.fixture_id;
      if (!fixtureId) continue;
      predictionRows.push({
        fixture_id: fixtureId,
        prediction_type: p.prediction_type ?? "1x2",
        predicted_value: p.predicted_value ?? "",
        confidence_score: p.confidence_score ?? null,
        frontier_explanation: p.frontier_explanation ?? null,
        status: p.status ?? "pending",
      });
    }

    if (predictionRows.length > 0) {
      const { error: predsError } = await supabase
        .from("predictions")
        .insert(predictionRows);
      if (predsError) throw predsError;
    }

    return NextResponse.json({
      ok: true,
      message: "Fixtures and predictions loaded.",
      insertedFixtures: insertedFixtures?.length ?? 0,
      insertedPredictions: predictionRows.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: (error as Error).message ?? String(error) },
      { status: 500 },
    );
  }
}

