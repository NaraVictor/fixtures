import type { Fixture, Prediction, Team } from "@/lib/data/types";
import {
  formatKickoffDateCompact,
  formatKickoffTime,
  normalizeConfidenceScore,
  teamAbbrev,
  weekOfYear,
} from "@/lib/format";
import { TeamAvatar } from "@/components/team-avatar";

type Fx = Fixture & {
  home_team: Team | null;
  away_team: Team | null;
};

function impliedOdds(confidence: number | null): string {
  if (confidence == null || confidence <= 0) return "—";
  const o = 1 / Math.min(0.95, Math.max(0.06, confidence));
  return o.toFixed(2);
}

export function FixtureMatchSummary({
  fixture,
  predictions,
}: {
  fixture: Fx;
  predictions: Prediction[];
}) {
  const home = fixture.home_team;
  const away = fixture.away_team;
  const homeName = home?.name ?? "Home";
  const awayName = away?.name ?? "Away";
  const homeCode = teamAbbrev(homeName, home?.short_name);
  const awayCode = teamAbbrev(awayName, away?.short_name);
  const kickoff = fixture.started_at ?? fixture.fixture_date;
  const isLive = fixture.status === "live";
  const isFinished = fixture.status === "finished";
  const hg = fixture.home_goals ?? 0;
  const ag = fixture.away_goals ?? 0;

  const centerMain = isLive
    ? "LIVE"
    : isFinished
      ? `${hg} : ${ag}`
      : formatKickoffTime(kickoff);
  const centerSub = isLive
    ? `${hg} : ${ag}`
    : isFinished
      ? "FT"
      : formatKickoffDateCompact(kickoff);

  const oneXtwo = predictions.find(
    (p) => p.prediction_type.trim().toLowerCase() === "1x2",
  );
  const val = oneXtwo?.predicted_value?.trim().toLowerCase() ?? "";
  const lean1 = val === "1";
  const leanX = val === "x";
  const lean2 = val === "2";
  const oneX2Conf = normalizeConfidenceScore(oneXtwo?.confidence_score);

  return (
    <section
      className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-5"
      aria-label="Match summary">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Week {weekOfYear(fixture.fixture_date)}
      </p>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[var(--text-primary)]">
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamAvatar
            name={homeName}
            surface="match"
            className="!h-11 !w-11 !text-xs sm:!h-12 sm:!w-12"
          />
          <span className="text-xs font-bold tracking-wide text-[var(--match-card-muted)]">
            {homeCode}
          </span>
          <span className="w-full truncate text-sm font-semibold sm:text-base">
            {homeName}
          </span>
        </div>
        <div className="flex min-w-[5.5rem] flex-col items-center gap-0.5 px-1">
          <span
            className={`text-2xl font-bold tabular-nums tracking-tight sm:text-3xl ${
              isFinished || isLive
                ? "text-[var(--text-primary)]"
                : "text-[var(--color-accent)]"
            }`}>
            {centerMain}
          </span>
          <span className="text-xs font-medium text-[var(--match-card-muted)]">
            {centerSub}
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
          <TeamAvatar
            name={awayName}
            surface="match"
            className="!h-11 !w-11 !text-xs sm:!h-12 sm:!w-12"
          />
          <span className="text-xs font-bold tracking-wide text-[var(--match-card-muted)]">
            {awayCode}
          </span>
          <span className="w-full truncate text-sm font-semibold sm:text-base">
            {awayName}
          </span>
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="mt-6 border-t border-[var(--border-color)] pt-4">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Model lean (1X2)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <LeanPill
              label="1"
              sub={lean1 ? impliedOdds(oneX2Conf) : "—"}
              active={lean1}
              confidence={lean1 ? oneX2Conf : null}
            />
            <LeanPill
              label="X"
              sub={leanX ? impliedOdds(oneX2Conf) : "—"}
              active={leanX}
              confidence={leanX ? oneX2Conf : null}
            />
            <LeanPill
              label="2"
              sub={lean2 ? impliedOdds(oneX2Conf) : "—"}
              active={lean2}
              confidence={lean2 ? oneX2Conf : null}
            />
          </div>
          <p className="mt-2 text-center text-[10px] text-[var(--text-muted)]">
            Implied prices from model confidence — not book odds.
          </p>
        </div>
      )}
    </section>
  );
}

function LeanPill({
  label,
  sub,
  active,
  confidence,
}: {
  label: string;
  sub: string;
  active: boolean;
  confidence: number | null;
}) {
  return (
    <div
      className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]"
          : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
      }`}>
      <div className="text-xs font-bold text-[var(--text-primary)]">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-secondary)]">
        {sub}
      </div>
      {active && confidence != null && (
        <div className="mt-1 text-[10px] font-medium text-[var(--color-primary)]">
          {(confidence * 100).toFixed(0)}% conf.
        </div>
      )}
    </div>
  );
}
