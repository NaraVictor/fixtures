import Link from "next/link";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 30;

type FixtureRow = {
  id: string;
  slug: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  fixture_date: string;
  started_at: string | null;
  ended_at: string | null;
  status: string;
  home_goals: number | null;
  away_goals: number | null;
  half_time_home: number | null;
  half_time_away: number | null;
  venue: string | null;
  raw_metadata: { referee?: string } | null;
  home_team: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[];
  away_team: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[];
  league: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[];
};

const getFixture = cache(async (slug: string) => {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("fixtures")
    .select(
      "id, slug, league_id, fixture_date, started_at, ended_at, status, home_goals, away_goals, half_time_home, half_time_away, venue, raw_metadata, home_team:teams!fixtures_home_team_id_fkey(id, name, slug), away_team:teams!fixtures_away_team_id_fkey(id, name, slug), league:leagues(id, name, slug)"
    )
    .eq("slug", slug)
    .single();
  if (error || !data) return { fixture: null, supabase };
  return { fixture: data as unknown as FixtureRow, supabase };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { fixture } = await getFixture(slug);
  if (!fixture) return { title: "Fixture" };
  const ht = Array.isArray(fixture.home_team) ? fixture.home_team[0] : fixture.home_team;
  const at = Array.isArray(fixture.away_team) ? fixture.away_team[0] : fixture.away_team;
  const league = Array.isArray(fixture.league) ? fixture.league[0] : fixture.league;
  const title = `${ht?.name ?? "Home"} v ${at?.name ?? "Away"} | ${league?.name ?? "Fixture"}`;
  const description =
    fixture.status === "finished"
      ? `Final score: ${fixture.home_goals ?? 0}–${fixture.away_goals ?? 0}`
      : `${league?.name ?? "Match"} – ${fixture.fixture_date}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function FixturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { fixture, supabase } = await getFixture(slug);
  if (!fixture) notFound();

  const [
    { data: predictions },
    { data: lineups },
    { data: absences },
  ] = await Promise.all([
    supabase
      .from("predictions")
      .select("id, status, prediction_type, predicted_value, confidence_score, frontier_explanation, local_model_output, model_version, created_at")
      .eq("fixture_id", fixture.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("fixture_lineups")
      .select("formation, team_id, teams(name)")
      .eq("fixture_id", fixture.id),
    supabase
      .from("fixture_absences")
      .select("player_name_or_id, absence_type, impact_level, team_id, teams(name)")
      .eq("fixture_id", fixture.id),
  ]);

  let leagueAccuracy = { correct: 0, total: 0 };
  if (fixture.league_id) {
    const { data: fixIds } = await supabase.from("fixtures").select("id").eq("league_id", fixture.league_id).limit(200);
    const ids = (fixIds ?? []).map((x: { id: string }) => x.id);
    if (ids.length > 0) {
      const { data: preds } = await supabase
        .from("predictions")
        .select("status")
        .in("fixture_id", ids)
        .in("status", ["correct", "incorrect"])
        .limit(300);
      leagueAccuracy = {
        correct: (preds ?? []).filter((r: { status: string }) => r.status === "correct").length,
        total: (preds ?? []).length,
      };
    }
  }

  const f = {
    ...fixture,
    home_team: Array.isArray(fixture.home_team) ? fixture.home_team[0] : fixture.home_team,
    away_team: Array.isArray(fixture.away_team) ? fixture.away_team[0] : fixture.away_team,
    league: Array.isArray(fixture.league) ? fixture.league[0] : fixture.league,
  };
  const lineupList = (lineups ?? []) as unknown as Array<{ formation: string | null; team_id: string; teams: { name: string } | null }>;
  const absenceList = (absences ?? []) as unknown as Array<{
    player_name_or_id: string | null;
    absence_type: string;
    impact_level: string;
    team_id: string;
    teams: { name: string } | null;
  }>;

  return (
    <main className="min-h-screen p-6">
      <Link href="/" className="text-sm text-gray-600 hover:underline">
        ← Back to predictions
      </Link>
      <header className="mt-4">
        <h1 className="text-2xl font-bold">
          {f.home_team?.name ?? "Home"} v {f.away_team?.name ?? "Away"}
        </h1>
        <p className="text-gray-600">{f.league?.name}</p>
      </header>

      <section className="mt-6 rounded border border-gray-200 p-4">
        <h2 className="font-semibold">Fixture</h2>
        <dl className="mt-2 grid gap-1 text-sm">
          <div>
            <span className="text-gray-500">Date:</span> {f.fixture_date}
          </div>
          {f.started_at && (
            <div>
              <span className="text-gray-500">Started:</span> {new Date(f.started_at).toLocaleString()}
            </div>
          )}
          {f.ended_at && (
            <div>
              <span className="text-gray-500">Ended:</span> {new Date(f.ended_at).toLocaleString()}
            </div>
          )}
          <div>
            <span className="text-gray-500">Status:</span> <span className="capitalize">{f.status}</span>
          </div>
          {f.status === "finished" && (
            <div>
              <span className="text-gray-500">Score:</span> {f.home_goals ?? 0} – {f.away_goals ?? 0}
              {f.half_time_home != null && (
                <span className="ml-2 text-gray-500">(HT {f.half_time_home}–{f.half_time_away})</span>
              )}
            </div>
          )}
          {f.venue && (
            <div>
              <span className="text-gray-500">Venue:</span> {f.venue}
            </div>
          )}
          {f.raw_metadata?.referee && (
            <div>
              <span className="text-gray-500">Referee:</span> {f.raw_metadata.referee}
            </div>
          )}
        </dl>
      </section>

      {predictions?.length ? (
        <section className="mt-6 rounded border border-gray-200 p-4">
          <h2 className="font-semibold">Predictions</h2>
          <ul className="mt-2 space-y-2">
            {(predictions as Array<{
              id: string;
              status: string;
              prediction_type: string;
              predicted_value: string;
              confidence_score: number | null;
              frontier_explanation: string | null;
              local_model_output: Record<string, unknown> | null;
              model_version: string | null;
              created_at: string;
            }>).map((p) => (
              <li key={p.id} className="border-l-2 border-gray-300 pl-3">
                <div className="font-medium">
                  {p.prediction_type} → {p.predicted_value}
                  {p.confidence_score != null && (
                    <span className="ml-2 text-gray-600">({(p.confidence_score * 100).toFixed(0)}%)</span>
                  )}
                  {p.model_version && (
                    <span className="ml-2 text-xs text-gray-400">model {p.model_version}</span>
                  )}
                </div>
                <div className="text-sm capitalize text-gray-500">Status: {p.status}</div>
                {p.frontier_explanation && (
                  <p className="mt-1 text-sm text-gray-700">{p.frontier_explanation}</p>
                )}
                {p.local_model_output && typeof p.local_model_output === "object" && (
                  <p className="mt-1 text-xs text-gray-600">
                    Model: {JSON.stringify(p.local_model_output).slice(0, 120)}
                    {JSON.stringify(p.local_model_output).length > 120 ? "…" : ""}
                  </p>
                )}
                <div className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 text-gray-500">No predictions for this fixture.</p>
      )}

      {leagueAccuracy.total > 0 && (
        <section className="mt-6 rounded border border-gray-200 p-4">
          <h2 className="font-semibold">Previous performance (league)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Recent predictions in {f.league?.name}: {leagueAccuracy.correct} correct of {leagueAccuracy.total} ({((leagueAccuracy.correct / leagueAccuracy.total) * 100).toFixed(0)}%).
          </p>
        </section>
      )}

      {(lineupList.length > 0 || absenceList.length > 0) && (
        <section className="mt-6 rounded border border-gray-200 p-4">
          <h2 className="font-semibold">Lineups & absences</h2>
          {lineupList.length > 0 && (
            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-700">Formations</h3>
              <ul className="mt-1 space-y-1 text-sm">
                {lineupList.map((l, i) => (
                  <li key={i}>
                    {(l.teams as { name: string } | null)?.name ?? "Team"}: {l.formation ?? "—"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {absenceList.length > 0 && (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-gray-700">Absences</h3>
              <ul className="mt-1 space-y-1 text-sm">
                {absenceList.map((a, i) => (
                  <li key={i} className="capitalize">
                    {a.player_name_or_id ?? "Player"} ({a.absence_type}, {a.impact_level} impact)
                    {(a.teams as { name: string } | null)?.name && ` – ${(a.teams as { name: string }).name}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <footer className="mt-8 text-sm text-gray-500">
        <Link href="/office" className="underline">Office</Link>
      </footer>
    </main>
  );
}
