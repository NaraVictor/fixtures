import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getFixtureBySlug,
  getPredictionsForFixture,
  getLineupsForFixture,
  getAbsencesForFixture,
  getLeagueAccuracy,
  getTeamPosition,
} from "@/lib/data";
import { formatDate, formatDateTime, ordinal } from "@/lib/format";
import { FixtureMatchSummary } from "@/components/fixture-match-summary";
import { FixtureInsightTabs } from "@/components/fixture-insight-tabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fixture = getFixtureBySlug(slug);
  if (!fixture) return { title: "Fixture" };
  const title = `${fixture.home_team?.name ?? "Home"} v ${fixture.away_team?.name ?? "Away"} | ${fixture.league?.name ?? "Fixture"}`;
  const description =
    fixture.status === "finished"
      ? `Final score: ${fixture.home_goals ?? 0}–${fixture.away_goals ?? 0}`
      : `${fixture.league?.name ?? "Match"} – ${fixture.fixture_date}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function FixturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fixture = getFixtureBySlug(slug);
  if (!fixture) notFound();

  const [predictions, lineups, absences, leagueAccuracy] = [
    getPredictionsForFixture(fixture.id),
    getLineupsForFixture(fixture.id),
    getAbsencesForFixture(fixture.id),
    fixture.league_id
      ? getLeagueAccuracy(fixture.league_id)
      : { correct: 0, total: 0 },
  ];

  const homePosition =
    fixture.league_id && fixture.home_team_id
      ? getTeamPosition(fixture.home_team_id, fixture.league_id)
      : null;
  const awayPosition =
    fixture.league_id && fixture.away_team_id
      ? getTeamPosition(fixture.away_team_id, fixture.league_id)
      : null;
  const homeName = fixture.home_team?.name ?? "Home";
  const awayName = fixture.away_team?.name ?? "Away";
  const matchLabel = `${homeName}${homePosition ? ` (${ordinal(homePosition)})` : ""} v ${awayName}${awayPosition ? ` (${ordinal(awayPosition)})` : ""}`;
  const weather = fixture.raw_metadata?.weather ?? null;
  const keymanAbsences = absences.filter(
    (a) => a.impact_level.toLowerCase() === "key",
  );
  const hasLineupSection = lineups.length > 0 || absences.length > 0 || weather;

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <div className="container-narrow py-4 md:py-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-base font-bold tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]">
            <span aria-hidden>←</span> Back
          </Link>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl text-[var(--text-muted)]"
            aria-hidden>
            ⋯
          </span>
        </div>

        <h1 className="mt-3 text-heading-1">{matchLabel}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {fixture.league?.name}
        </p>

        <div className="mt-6 space-y-4">
          <FixtureMatchSummary fixture={fixture} predictions={predictions} />
          <FixtureInsightTabs predictions={predictions} />
        </div>

        <section
          className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"
          aria-labelledby="fixture-details-heading">
          <h2 id="fixture-details-heading" className="text-heading-2 mb-4">
            Match details
          </h2>
          <dl className="grid gap-x-6 gap-y-3 text-body sm:grid-cols-2">
            <div>
              <dt className="text-caption text-[var(--text-muted)]">Date</dt>
              <dd>{formatDate(fixture.fixture_date, "MMM d")}</dd>
            </div>
            <div>
              <dt className="text-caption text-[var(--text-muted)]">Status</dt>
              <dd className="capitalize">{fixture.status}</dd>
            </div>
            {fixture.started_at && (
              <div>
                <dt className="text-caption text-[var(--text-muted)]">
                  Kick-off
                </dt>
                <dd>{formatDateTime(fixture.started_at)}</dd>
              </div>
            )}
            {fixture.ended_at && (
              <div>
                <dt className="text-caption text-[var(--text-muted)]">
                  Full time
                </dt>
                <dd>{formatDateTime(fixture.ended_at)}</dd>
              </div>
            )}
            {fixture.status === "finished" &&
              fixture.half_time_home != null && (
                <div className="sm:col-span-2">
                  <dt className="text-caption text-[var(--text-muted)]">
                    Half-time
                  </dt>
                  <dd className="font-mono tabular-nums">
                    {fixture.half_time_home}–{fixture.half_time_away}
                  </dd>
                </div>
              )}
            {fixture.venue && (
              <div>
                <dt className="text-caption text-[var(--text-muted)]">Venue</dt>
                <dd>{fixture.venue}</dd>
              </div>
            )}
            {fixture.raw_metadata?.referee && (
              <div>
                <dt className="text-caption text-[var(--text-muted)]">
                  Referee
                </dt>
                <dd>{fixture.raw_metadata.referee}</dd>
              </div>
            )}
          </dl>
        </section>

        {leagueAccuracy.total > 0 && (
          <section
            className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"
            aria-labelledby="league-performance-heading">
            <h2 id="league-performance-heading" className="text-heading-2 mb-2">
              League performance
            </h2>
            <p className="text-body text-[var(--text-secondary)]">
              In {fixture.league?.name}:{" "}
              <strong className="text-[var(--text-primary)]">
                {leagueAccuracy.correct} won
              </strong>{" "}
              of {leagueAccuracy.total} (
              {((leagueAccuracy.correct / leagueAccuracy.total) * 100).toFixed(
                0,
              )}
              %).
            </p>
          </section>
        )}

        {hasLineupSection && (
          <section
            className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"
            aria-labelledby="lineups-heading">
            <h2 id="lineups-heading" className="text-heading-2 mb-4">
              Lineups & absences
            </h2>
            {weather && (
              <div className="mb-4">
                <h3 className="text-body font-medium text-[var(--text-primary)]">
                  Weather
                </h3>
                <p className="mt-1 text-body text-[var(--text-secondary)]">
                  {weather}
                </p>
              </div>
            )}
            {lineups.length > 0 && (
              <div className={weather ? "mt-4" : ""}>
                <h3 className="text-body font-medium text-[var(--text-primary)]">
                  Formations
                </h3>
                <ul className="mt-2 space-y-1 text-body text-[var(--text-secondary)]">
                  {lineups.map((l, i) => (
                    <li key={i}>
                      {l.team_name}: {l.formation ?? "—"}
                    </li>
                  ))}
                </ul>
                {lineups.some((l) => l.full_line && l.full_line.length > 0) && (
                  <div className="mt-4">
                    <h3 className="text-body font-medium text-[var(--text-primary)]">
                      Full line
                    </h3>
                    {lineups.map(
                      (l, i) =>
                        l.full_line &&
                        l.full_line.length > 0 && (
                          <div key={i} className="mt-2">
                            <p className="text-caption font-medium text-[var(--text-muted)]">
                              {l.team_name}
                            </p>
                            <p className="mt-0.5 text-body text-[var(--text-secondary)]">
                              {l.full_line.join(", ")}
                            </p>
                          </div>
                        ),
                    )}
                  </div>
                )}
              </div>
            )}
            {keymanAbsences.length > 0 && (
              <div className={lineups.length > 0 || weather ? "mt-4" : ""}>
                <h3 className="text-body font-medium text-[var(--text-primary)]">
                  Missing key players
                </h3>
                <ul className="mt-2 space-y-1 text-body text-[var(--text-secondary)]">
                  {keymanAbsences.map((a, i) => (
                    <li key={i} className="capitalize">
                      {a.player_name_or_id ?? "Player"} ({a.absence_type}) –{" "}
                      {a.team_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {absences.length > 0 && keymanAbsences.length < absences.length && (
              <div className="mt-4">
                <h3 className="text-body font-medium text-[var(--text-primary)]">
                  Other absences
                </h3>
                <ul className="mt-2 space-y-1 text-body text-[var(--text-secondary)]">
                  {absences
                    .filter((a) => a.impact_level.toLowerCase() !== "key")
                    .map((a, i) => (
                      <li key={i} className="capitalize">
                        {a.player_name_or_id ?? "Player"} ({a.absence_type},{" "}
                        {a.impact_level} impact) – {a.team_name}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <footer className="mt-10 flex gap-4 text-caption text-[var(--text-muted)]">
          <Link
            href="/"
            className="underline hover:no-underline hover:text-[var(--color-primary)]">
            ← Picks
          </Link>
          <Link
            href="/office"
            className="underline hover:no-underline hover:text-[var(--color-primary)]">
            Office
          </Link>
        </footer>
      </div>
    </main>
  );
}
