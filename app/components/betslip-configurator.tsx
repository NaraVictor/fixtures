"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type League = { id: string; name: string; slug: string };
type Pick = {
  predictionId: string;
  slug: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  fixtureDate: string;
  marketType: string;
  predictedValue: string;
  confidenceScore: number | null;
  oddsValue: number;
};

export function BetslipConfigurator() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [totalOdds, setTotalOdds] = useState(5);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [marketType, setMarketType] = useState("1x2");
  const [maxLegs, setMaxLegs] = useState(10);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [picks, setPicks] = useState<Pick[]>([]);
  const [combinedOdds, setCombinedOdds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/leagues")
      .then((r) => r.json())
      .then((data) => {
        setLeagues(Array.isArray(data) ? data : []);
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, []);

  const generate = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      totalOdds: String(totalOdds),
      marketType,
      maxLegs: String(maxLegs),
      date,
    });
    if (selectedLeagues.length)
      params.set("leagues", selectedLeagues.join(","));
    fetch(`/api/betslip?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPicks(data.picks ?? []);
        setCombinedOdds(data.combinedOdds ?? 0);
      })
      .finally(() => setLoading(false));
  }, [totalOdds, selectedLeagues, marketType, maxLegs, date]);

  const toggleLeague = (slug: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  return (
    <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
      <h2 className="mb-3 text-lg font-semibold">Betslip configurator</h2>
      <p className="mb-4 text-sm text-gray-600">
        AI selection of high-probability picks by total slip odds, league(s),
        market type, and match date.
      </p>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Target total odds
          </label>
          <input
            type="number"
            min={1.01}
            max={1000}
            step={0.1}
            value={totalOdds}
            onChange={(e) => setTotalOdds(Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Market type
          </label>
          <select
            value={marketType}
            onChange={(e) => setMarketType(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
            <option value="1x2">1X2</option>
            <option value="over_under_2.5">Over / Under 2.5</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Max legs
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={maxLegs}
            onChange={(e) => setMaxLegs(Number(e.target.value) || 1)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Match date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
            {loading ? "Generating…" : "Generate slip"}
          </button>
        </div>
      </div>

      {configLoaded && leagues.length > 0 && (
        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium text-gray-700">
            Leagues (optional)
          </span>
          <div className="flex flex-wrap gap-2">
            {leagues.map((l) => (
              <label
                key={l.id}
                className="flex cursor-pointer items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={selectedLeagues.includes(l.slug)}
                  onChange={() => toggleLeague(l.slug)}
                  className="rounded border-gray-300"
                />
                {l.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {picks.length > 0 && (
        <div className="mt-4 rounded border border-gray-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Suggested slip</span>
            <span className="font-mono text-gray-600">
              Combined odds: {combinedOdds.toFixed(2)}
            </span>
          </div>
          <ul className="space-y-2">
            {picks.map((p) => (
              <li
                key={p.predictionId}
                className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                <div>
                  <Link
                    href={`/fixture/${p.slug}`}
                    className="font-medium hover:underline">
                    {p.homeTeam} v {p.awayTeam}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {p.league} · {p.fixtureDate}
                    {p.confidenceScore != null &&
                      ` · ${(p.confidenceScore * 100).toFixed(0)}%`}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <span className="font-mono">{p.predictedValue}</span>
                  <span className="ml-1 text-gray-500">
                    @ {p.oddsValue.toFixed(2)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
