import Link from "next/link";
import type { PredictionWithFixture } from "@/lib/data/types";
import {
  formatKickoffDateCompact,
  formatKickoffTime,
  formatMarketAndPick,
} from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { TeamAvatar } from "@/components/team-avatar";

export function MatchListRow({ p }: { p: PredictionWithFixture }) {
  const f = p.fixture;
  const home = f.home_team?.name ?? "Home";
  const away = f.away_team?.name ?? "Away";
  const kickoff = f.started_at ?? f.fixture_date;
  const isLive = f.status === "live";
  const isFinished = f.status === "finished";

  const centerMain = isLive
    ? "LIVE"
    : isFinished
      ? `${f.home_goals ?? 0}:${f.away_goals ?? 0}`
      : formatKickoffTime(kickoff);

  const centerSub = isLive
    ? `${f.home_goals ?? 0}:${f.away_goals ?? 0}`
    : isFinished
      ? "FT"
      : formatKickoffDateCompact(kickoff);

  return (
    <li className="min-w-0">
      <Link
        href={`/fixture/${f.slug}`}
        className="pick-card match-surface match-card flex flex-col gap-3 rounded-2xl border border-[var(--match-card-border)] bg-[var(--match-card-bg)] p-4 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] hover:border-[var(--color-primary)]/40 motion-reduce:transition-none"
        aria-label={`${home} versus ${away}. Open match details.`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-[var(--match-card-text)] sm:text-base">
              {home}
            </p>
          </div>
          <TeamAvatar
            name={home}
            className="!h-8 !w-8 !text-[9px] sm:!h-9 sm:!w-9 sm:!text-[10px]"
            surface="match"
          />
          <div className="flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 text-center sm:min-w-[5rem]">
            <span
              className={`text-sm font-bold tabular-nums sm:text-base ${
                isLive || isFinished
                  ? "text-[var(--match-card-text)]"
                  : "text-[var(--color-accent)]"
              }`}>
              {centerMain}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--match-card-muted)] sm:text-xs">
              {centerSub}
            </span>
          </div>
          <TeamAvatar
            name={away}
            className="!h-8 !w-8 !text-[9px] sm:!h-9 sm:!w-9 sm:!text-[10px]"
            surface="match"
          />
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-sm font-semibold text-[var(--match-card-text)] sm:text-base">
              {away}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          <span className="max-w-full truncate rounded-full bg-[var(--match-card-chip-bg)] px-3 py-1 text-xs font-medium text-[var(--match-card-text)] sm:text-sm">
            {formatMarketAndPick(p.prediction_type, p.predicted_value)}
          </span>
          {p.confidence_score != null && (
            <span className="confidence-pill text-xs sm:text-sm">
              {(p.confidence_score * 100).toFixed(0)}%
            </span>
          )}
          <StatusBadge status={p.status} />
        </div>
      </Link>
    </li>
  );
}
