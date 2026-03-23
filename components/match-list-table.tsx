"use client";

import Link from "next/link";
import type { PredictionWithFixture } from "@/lib/data/types";
import {
  formatKickoffDateCompact,
  formatKickoffTime,
  formatMarketAndPick,
} from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";

export function MatchListTable({
  predictions,
}: {
  predictions: PredictionWithFixture[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--match-card-border)]">
      <table className="match-card w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-[var(--match-card-chip-bg)]">
          <tr className="border-b border-[var(--match-card-border)] text-[var(--match-card-muted)]">
            <th className="px-3 py-2.5 font-medium" scope="col">
              #
            </th>
            <th className="px-3 py-2.5 font-medium" scope="col">
              Match
            </th>
            <th className="px-3 py-2.5 font-medium" scope="col">
              Time / score
            </th>
            <th className="px-3 py-2.5 font-medium" scope="col">
              Pick
            </th>
            <th className="px-3 py-2.5 font-medium" scope="col">
              Conf.
            </th>
            <th className="px-3 py-2.5 font-medium" scope="col">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((p, i) => (
            <MatchTableRow key={p.id} p={p} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchTableRow({
  p,
  index,
}: {
  p: PredictionWithFixture;
  index: number;
}) {
  const f = p.fixture;
  const home = f.home_team?.name ?? "Home";
  const away = f.away_team?.name ?? "Away";
  const kickoff = f.started_at ?? f.fixture_date;
  const isLive = f.status === "live";
  const isFinished = f.status === "finished";

  const when = isLive
    ? `Live ${f.home_goals ?? 0}:${f.away_goals ?? 0}`
    : isFinished
      ? `${f.home_goals ?? 0}:${f.away_goals ?? 0} FT`
      : `${formatKickoffTime(kickoff)} · ${formatKickoffDateCompact(kickoff)}`;

  return (
    <tr className="match-surface border-t border-[var(--match-card-border)] transition-colors hover:bg-[var(--match-card-chip-bg)]/50">
      <td className="px-3 py-2.5 tabular-nums text-[var(--match-card-muted)]">
        {index + 1}
      </td>
      <td className="px-3 py-2.5 text-[var(--match-card-text)]">
        <Link
          href={`/fixture/${f.slug}`}
          className="text-[var(--color-primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--match-card-bg)]">
          {home} v {away}
        </Link>
      </td>
      <td className="px-3 py-2.5 tabular-nums text-[var(--match-card-muted)]">
        {when}
      </td>
      <td className="max-w-[10rem] truncate px-3 py-2.5 text-[var(--match-card-text)]">
        {formatMarketAndPick(p.prediction_type, p.predicted_value)}
      </td>
      <td className="px-3 py-2.5 tabular-nums text-[var(--match-card-text)]">
        {p.confidence_score != null
          ? `${(p.confidence_score * 100).toFixed(0)}%`
          : "—"}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={p.status} />
      </td>
    </tr>
  );
}
