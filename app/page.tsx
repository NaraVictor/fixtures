import { Suspense } from "react";
import {
  getPredictionsWithFixtures,
  getLeaguesList,
  getMarketTypesList,
} from "@/lib/data";
import type { FixtureStatus } from "@/lib/data/types";
import { FeaturedMatchCards } from "@/components/featured-match-cards";
import { HomeFiltersShell } from "@/components/home-filters-shell";
import { MatchList } from "@/components/match-list";
import { ScrollToMatchesOnHash } from "@/components/scroll-to-matches";

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

  const featured = [...predictions]
    .sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] motion-reduce:transition-none">
      <ScrollToMatchesOnHash />
      <div className="container-wide py-4 sm:py-6 md:py-8">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-heading-1 tracking-tight">Moon Odds</h1>
          <p
            id="home-intro"
            className="mt-2 max-w-prose text-body text-[var(--text-secondary)]">
            Get winning football tips powered by smart AI analysis. Rely on our
            trusted picks to boost your winning chances
          </p>
        </header>

        <FeaturedMatchCards items={featured} />

        <Suspense
          fallback={
            <div
              className="skeleton-shimmer mb-6 h-32 rounded-xl motion-reduce:bg-[var(--bg-secondary)]"
              aria-hidden
            />
          }>
          <HomeFiltersShell leagues={leagues} marketTypes={marketTypes}>
            {predictions.length === 0 ? (
              <div
                className="mx-auto max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center"
                role="status"
                aria-live="polite">
                <p className="text-body font-medium text-[var(--text-primary)]">
                  Nothing on the slate
                </p>
                <p className="mt-2 text-caption text-[var(--text-secondary)]">
                  Widen your filters or reset—the full fixture list is one tap away.
                </p>
              </div>
            ) : (
              <MatchList predictions={predictions} />
            )}
          </HomeFiltersShell>
        </Suspense>

        <footer className="mt-12 max-w-2xl border-t border-[var(--border-color)] pt-6 text-caption text-[var(--text-muted)]">
          <p>Demo data. Connect your backend for live fixtures and results.</p>
        </footer>
      </div>
    </main>
  );
}
