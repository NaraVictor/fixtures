import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export default async function OfficeDashboard() {
  const supabase = createClient(await cookies());

  const { data: preds } = await supabase
    .from("predictions")
    .select("id, status, prediction_type, model_version, fixture_id")
    .in("status", ["correct", "incorrect"]);

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select("id, league_id")
    .in("id", [...new Set((preds ?? []).map((p) => p.fixture_id))]);

  const leagueById = new Map((fixtures ?? []).map((f) => [f.id, f.league_id]));
  const { data: leagues } = await supabase.from("leagues").select("id, name, slug");
  const leagueNames = new Map((leagues ?? []).map((l) => [l.id, l.name]));

  const byLeague: Record<string, { correct: number; total: number }> = {};
  const byType: Record<string, { correct: number; total: number }> = {};
  const byModel: Record<string, { correct: number; total: number }> = {};
  let totalCorrect = 0;
  let totalResolved = 0;

  for (const p of preds ?? []) {
    const leagueId = leagueById.get(p.fixture_id) ?? null;
    const leagueName = leagueId ? leagueNames.get(leagueId) ?? leagueId : "—";
    const type = p.prediction_type ?? "—";
    const model = p.model_version ?? "—";
    const correct = p.status === "correct" ? 1 : 0;
    totalResolved++;
    totalCorrect += correct;

    byLeague[leagueName] = byLeague[leagueName] ?? { correct: 0, total: 0 };
    byLeague[leagueName].total++;
    byLeague[leagueName].correct += correct;

    byType[type] = byType[type] ?? { correct: 0, total: 0 };
    byType[type].total++;
    byType[type].correct += correct;

    byModel[model] = byModel[model] ?? { correct: 0, total: 0 };
    byModel[model].total++;
    byModel[model].correct += correct;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Office</h1>
      <p className="mt-2 text-gray-600">Performance and data management.</p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Overall</h2>
        <p className="mt-1 text-sm text-gray-600">
          {totalResolved === 0
            ? "No resolved predictions yet."
            : `${totalCorrect} correct of ${totalResolved} (${((totalCorrect / totalResolved) * 100).toFixed(1)}% accuracy).`}
        </p>
      </section>

      {Object.keys(byLeague).length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">By league</h2>
          <table className="mt-2 w-full max-w-md border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4">League</th>
                <th className="py-2">Correct</th>
                <th className="py-2">Total</th>
                <th className="py-2">%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byLeague)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([name, { correct, total }]) => (
                  <tr key={name} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{name}</td>
                    <td className="py-2">{correct}</td>
                    <td className="py-2">{total}</td>
                    <td className="py-2">{(total ? (correct / total) * 100 : 0).toFixed(0)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {Object.keys(byType).length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">By prediction type</h2>
          <table className="mt-2 w-full max-w-md border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2">Correct</th>
                <th className="py-2">Total</th>
                <th className="py-2">%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byType).map(([name, { correct, total }]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{name}</td>
                  <td className="py-2">{correct}</td>
                  <td className="py-2">{total}</td>
                  <td className="py-2">{(total ? (correct / total) * 100 : 0).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {Object.keys(byModel).length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">By model version</h2>
          <table className="mt-2 w-full max-w-md border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4">Model</th>
                <th className="py-2">Correct</th>
                <th className="py-2">Total</th>
                <th className="py-2">%</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byModel).map(([name, { correct, total }]) => (
                <tr key={name} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{name}</td>
                  <td className="py-2">{correct}</td>
                  <td className="py-2">{total}</td>
                  <td className="py-2">{(total ? (correct / total) * 100 : 0).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
