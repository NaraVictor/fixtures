import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AdminActions } from "@/components/admin-actions";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = createClient(await cookies());
  const validStatuses = ["scheduled", "live", "finished"] as const;
  const status =
    params.status &&
    validStatuses.includes(params.status as (typeof validStatuses)[number])
      ? params.status
      : undefined;

  let query = supabase
    .from("predictions")
    .select(
      "id, status, prediction_type, predicted_value, confidence_score, frontier_explanation, created_at, fixture:fixtures(id, slug, fixture_date, started_at, ended_at, status, home_goals, away_goals, home_team:teams!fixtures_home_team_id_fkey(name, slug), away_team:teams!fixtures_away_team_id_fkey(name, slug), league:leagues(name, slug))",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    const { data: rows } = await supabase
      .from("fixtures")
      .select("id")
      .eq("status", status);
    const ids = (rows ?? []).map((r) => r.id);
    if (ids.length) query = query.in("fixture_id", ids);
    else query = query.in("fixture_id", ["__none__"]);
  }

  const { data: predictions, error } = await query;

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-2xl font-bold">Fixtures</h1>
        <p className="mt-2 text-red-600">Error loading predictions.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Fixtures</h1>
        <p className="text-gray-600">Predictions and results</p>
      </header>

      <AdminActions />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/"
          className={`rounded px-3 py-1 text-sm ${!status ? "bg-primary text-white" : "bg-gray-200"}`}>
          All
        </Link>
        {(["scheduled", "live", "finished"] as const).map((s) => (
          <Link
            key={s}
            href={status === s ? "/" : `/?status=${s}`}
            className={`rounded px-3 py-1 text-sm capitalize ${status === s ? "bg-primary text-white" : "bg-gray-200"}`}>
            {s}
          </Link>
        ))}
      </div>

      {!predictions?.length ? (
        <p className="text-gray-500">No predictions yet.</p>
      ) : (
        <ul className="space-y-3">
          {(
            predictions as unknown as Array<{
              id: string;
              status: string;
              prediction_type: string;
              predicted_value: string;
              confidence_score: number | null;
              fixture: {
                id: string;
                slug: string;
                fixture_date: string;
                started_at: string | null;
                status: string;
                home_goals: number | null;
                away_goals: number | null;
                home_team: { name: string };
                away_team: { name: string };
                league: { name: string; slug: string };
              };
            }>
          ).map((p) => {
            const f = p.fixture;
            if (!f) return null;
            return (
              <li key={p.id} className="rounded border border-gray-200 p-3">
                <Link
                  href={`/fixture/${f.slug}`}
                  className="block font-medium hover:underline">
                  {f.home_team?.name ?? "Home"} v {f.away_team?.name ?? "Away"}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <span>{f.league?.name}</span>
                  <span>·</span>
                  <span>{f.fixture_date}</span>
                  {f.status === "finished" && (
                    <>
                      <span>·</span>
                      <span className="font-mono">
                        {f.home_goals ?? 0} – {f.away_goals ?? 0}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span className="capitalize">{p.status}</span>
                  {p.confidence_score != null && (
                    <span>({(p.confidence_score * 100).toFixed(0)}%)</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
