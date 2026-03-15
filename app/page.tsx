import Link from "next/link";
import { Suspense } from "react";
import {
  getPredictionsWithFixtures,
  getLeaguesList,
  getMarketTypesList,
} from "@/lib/data";
import type { FixtureStatus } from "@/lib/data/types";
import { formatDateTime, formatMarketAndPick } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { PicksFiltersSort } from "@/components/picks-filters-sort";

const VALID_STATUSES: FixtureStatus[] = ["scheduled", "live", "finished"];
const VALID_SORTS = [
  "confidence_asc",
  "confidence_desc",
  "kickoff_asc",
  "kickoff_desc",
] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    league?: string;
    marketType?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const statusFilter =
    params.status && VALID_STATUSES.includes(params.status as FixtureStatus)
      ? (params.status as FixtureStatus)
      : undefined;
  const leagueFilter = params.league ?? undefined;
  const marketTypeFilter = params.marketType ?? undefined;
  const sort =
    params.sort &&
    VALID_SORTS.includes(params.sort as (typeof VALID_SORTS)[number])
      ? (params.sort as (typeof VALID_SORTS)[number])
      : "kickoff_desc";
  const searchQuery = params.q?.trim() ?? undefined;

  const predictions = getPredictionsWithFixtures({
    status: statusFilter,
    league: leagueFilter,
    marketType: marketTypeFilter,
    search: searchQuery,
    sort,
  });
  const leagues = getLeaguesList();
  const marketTypes = getMarketTypesList();

  return (
    <main className="min-h-screen">
      <div className="container-narrow py-6 md:py-8">
        <section className="mb-6">
          <h1 className="text-heading-1">Picks</h1>
          <p className="mt-1 text-body">
            Smart football picks for your slip. Filter by league or market, sort
            by confidence or kick-off—then tap in and see the reasoning.
          </p>
          <p className="mt-1 text-caption text-[var(--text-muted)]">
            Tap any match for lineups, odds, and why we like it.
          </p>
        </section>

        <Suspense
          fallback={
            <div className="mb-6 h-24 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
          }>
          <PicksFiltersSort leagues={leagues} marketTypes={marketTypes} />
        </Suspense>

        {predictions.length === 0 ? (
          <div className="empty-state rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center">
            <p className="text-body font-medium text-[var(--text-primary)]">
              No picks in this filter
            </p>
            <p className="mt-1 text-caption">
              Change league, market, or search—or clear filters to see
              everything.
            </p>
          </div>
        ) : (
          <ul className="picks-list space-y-4" role="list">
            {predictions.map((p, index) => {
              const f = p.fixture;
              const homeName = f.home_team?.name ?? "Home";
              const awayName = f.away_team?.name ?? "Away";
              const leagueName = f.league?.name ?? "";
              const kickoff = f.started_at ?? f.fixture_date;

              return (
                <li key={p.id} className="relative">
                  <span
                    className="absolute left-4 top-5 text-2xl font-bold tabular-nums text-[var(--text-primary)]"
                    style={{ opacity: 0.4 }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <Link
                    href={`/fixture/${f.slug}`}
                    className="pick-card block rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 pl-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
                    aria-label={`${index + 1}. ${homeName} v ${awayName}, view details and reasoning`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {homeName}{" "}
                          <span className="text-[var(--text-muted)]">v</span>{" "}
                          {awayName}
                        </p>
                        <p className="mt-1 text-caption text-[var(--text-secondary)]">
                          {leagueName}
                          <span className="mx-1.5 text-[var(--text-muted)]">
                            ·
                          </span>
                          <time dateTime={kickoff}>
                            {formatDateTime(kickoff)}
                          </time>
                          {f.status === "finished" && (
                            <>
                              <span className="mx-1.5 text-[var(--text-muted)]">
                                ·
                              </span>
                              <span className="font-mono tabular-nums">
                                {f.home_goals ?? 0}–{f.away_goals ?? 0}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:items-start sm:justify-end">
                        <span className="rounded bg-[var(--bg-secondary)] px-2 py-1 text-sm font-medium text-[var(--text-primary)]">
                          {formatMarketAndPick(
                            p.prediction_type,
                            p.predicted_value,
                          )}
                        </span>
                        {p.confidence_score != null && (
                          <span
                            className="confidence-pill"
                            title={`${(p.confidence_score * 100).toFixed(0)}%`}>
                            {(p.confidence_score * 100).toFixed(0)}%
                          </span>
                        )}
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="mt-12 border-t border-[var(--border-color)] pt-6 text-caption text-[var(--text-muted)]">
          <p>Sample data. Full live data when backend is connected.</p>
        </footer>
      </div>
    </main>
  );
}
