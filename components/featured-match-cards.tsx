import Link from "next/link";
import type { PredictionWithFixture } from "@/lib/data/types";
import {
  formatDate,
  formatKickoffTime,
  formatMarketAndPick,
} from "@/lib/format";
import { TeamAvatar } from "@/components/team-avatar";

function weekHint(fixtureDate: string): string {
  const d = new Date(fixtureDate);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const day = Math.floor((+d - +start) / 86400000);
  const w = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `Week ${Math.min(w, 52)}`;
}

export function FeaturedMatchCards({
  items,
}: {
  items: PredictionWithFixture[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-8" aria-labelledby="featured-picks-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="featured-picks-heading" className="text-heading-2">
          Brightest picks
        </h2>
        <p className="text-caption text-[var(--text-muted)]">Top confidence this slate</p>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:snap-none md:grid-cols-3 md:gap-3 md:overflow-visible">
        {items.map((p) => (
          <FeaturedCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ p }: { p: PredictionWithFixture }) {
  const f = p.fixture;
  const home = f.home_team?.name ?? "Home";
  const away = f.away_team?.name ?? "Away";
  const league = f.league?.name ?? "League";
  const kickoff = f.started_at ?? f.fixture_date;
  const isLive = f.status === "live";
  const isFinished = f.status === "finished";
  const hg = f.home_goals ?? 0;
  const ag = f.away_goals ?? 0;

  return (
    <Link
      href={`/fixture/${f.slug}`}
      className="pick-card match-surface match-card mx-auto w-[90%] min-w-[min(100%,200px)] snap-center overflow-hidden rounded-xl border p-3 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] hover:border-[var(--color-primary)]/50 motion-reduce:transition-none md:mx-0 md:w-auto md:min-w-0">
      <header className="text-center">
        <p className="text-xs font-bold text-[var(--match-card-text)] sm:text-sm">
          {league}
        </p>
        <p className="mt-0.5 text-[9px] font-normal text-[var(--match-card-muted)] sm:text-[10px]">
          {weekHint(f.fixture_date)}
        </p>
      </header>
      <div className="mt-3 grid grid-cols-3 items-center gap-1 text-[var(--match-card-text)]">
        <div className="flex flex-col items-center gap-1 text-center">
          <TeamAvatar
            name={home}
            surface="match"
            className="!h-6 !w-6 !text-[7px] sm:!h-7 sm:!w-7 sm:!text-[8px]"
          />
          <span className="max-w-full truncate px-0.5 text-[10px] font-normal sm:text-xs">
            {home}
          </span>
          <span className="text-[8px] font-normal uppercase tracking-wide text-[var(--match-card-muted)]">
            Home
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          {isFinished || isLive ? (
            <>
              <span className="text-base font-semibold tabular-nums sm:text-lg">
                {hg} : {ag}
              </span>
              {isLive ? (
                <span className="rounded-xl border border-[var(--match-card-border)] px-1 py-0.5 text-[8px] font-medium uppercase text-[var(--color-accent)]">
                  Live
                </span>
              ) : (
                <span className="text-[8px] text-[var(--match-card-muted)]">
                  FT
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-base font-semibold tabular-nums text-[var(--color-accent)] sm:text-lg">
                {formatKickoffTime(kickoff)}
              </span>
              <span className="rounded-xl border border-[var(--match-card-border)] px-1 py-0.5 text-[8px] text-[var(--match-card-muted)]">
                {formatDate(kickoff, "short")}
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <TeamAvatar
            name={away}
            surface="match"
            className="!h-6 !w-6 !text-[7px] sm:!h-7 sm:!w-7 sm:!text-[8px]"
          />
          <span className="max-w-full truncate px-0.5 text-[10px] font-normal sm:text-xs">
            {away}
          </span>
          <span className="text-[8px] font-normal uppercase tracking-wide text-[var(--match-card-muted)]">
            Away
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-medium leading-snug text-[var(--match-card-text)] sm:text-xs">
        {formatMarketAndPick(p.prediction_type, p.predicted_value)}
      </p>
    </Link>
  );
}
