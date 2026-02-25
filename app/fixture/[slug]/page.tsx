import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const revalidate = 30;

export default async function FixturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createClient(await cookies());
  const { data: fixture, error } = await supabase
    .from("fixtures")
    .select(
      "id, slug, fixture_date, started_at, ended_at, status, home_goals, away_goals, half_time_home, half_time_away, venue, raw_metadata, home_team:teams!fixtures_home_team_id_fkey(id, name, slug), away_team:teams!fixtures_away_team_id_fkey(id, name, slug), league:leagues(id, name, slug)"
    )
    .eq("slug", slug)
    .single();

  if (error || !fixture) notFound();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("id, status, prediction_type, predicted_value, confidence_score, frontier_explanation, local_model_output, created_at")
    .eq("fixture_id", fixture.id)
    .order("created_at", { ascending: false });

  const raw = fixture as unknown as {
    slug: string;
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
    home_team: { name: string; slug: string } | { name: string; slug: string }[];
    away_team: { name: string; slug: string } | { name: string; slug: string }[];
    league: { name: string; slug: string } | { name: string; slug: string }[];
  };
  const f = {
    ...raw,
    home_team: Array.isArray(raw.home_team) ? raw.home_team[0] : raw.home_team,
    away_team: Array.isArray(raw.away_team) ? raw.away_team[0] : raw.away_team,
    league: Array.isArray(raw.league) ? raw.league[0] : raw.league,
  };

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
              created_at: string;
            }>).map((p) => (
              <li key={p.id} className="border-l-2 border-gray-300 pl-3">
                <div className="font-medium">
                  {p.prediction_type} → {p.predicted_value}
                  {p.confidence_score != null && (
                    <span className="ml-2 text-gray-600">({(p.confidence_score * 100).toFixed(0)}%)</span>
                  )}
                </div>
                <div className="text-sm capitalize text-gray-500">Status: {p.status}</div>
                {p.frontier_explanation && (
                  <p className="mt-1 text-sm text-gray-700">{p.frontier_explanation}</p>
                )}
                <div className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 text-gray-500">No predictions for this fixture.</p>
      )}

      <footer className="mt-8 text-sm text-gray-500">
        <Link href="/office" className="underline">Office</Link>
      </footer>
    </main>
  );
}
