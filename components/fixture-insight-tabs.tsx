"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import type { Prediction } from "@/lib/data/types";
import {
  formatDateTime,
  formatMarketAndPick,
  formatMarketLabel,
  formatPickLabel,
  normalizeConfidenceScore,
} from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";

const TABS = [
  { id: "reason" as const, label: "Prediction reason" },
  { id: "markets" as const, label: "Market picks" },
  { id: "confidence" as const, label: "Confidence by market" },
];

function confBg(conf: number | null): string {
  if (conf == null) return "bg-[var(--bg-secondary)] text-[var(--text-muted)]";
  if (conf >= 0.72)
    return "bg-emerald-500/20 text-[var(--text-primary)] ring-1 ring-inset ring-emerald-500/25";
  if (conf >= 0.45)
    return "bg-violet-500/20 text-[var(--text-primary)] ring-1 ring-inset ring-violet-500/25";
  return "bg-rose-500/20 text-[var(--text-primary)] ring-1 ring-inset ring-rose-500/25";
}

function impliedOdds(confidence: number | null): string {
  if (confidence == null || confidence <= 0) return "—";
  return (1 / Math.min(0.95, Math.max(0.06, confidence))).toFixed(2);
}

function valueScore(p: Prediction): string {
  const raw = p.local_model_output;
  if (raw && typeof raw === "object" && "staking_unit" in raw) {
    const u = (raw as { staking_unit?: number }).staking_unit;
    if (typeof u === "number") return (u / 10).toFixed(2);
  }
  const c = normalizeConfidenceScore(p.confidence_score);
  if (c != null) return ((c - 0.5) * 2).toFixed(2);
  return "—";
}

export function FixtureInsightTabs({
  predictions,
  className = "",
}: {
  predictions: Prediction[];
  className?: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("reason");
  const sorted = [...predictions].sort(
    (a, b) =>
      (normalizeConfidenceScore(b.confidence_score) ?? 0) -
      (normalizeConfidenceScore(a.confidence_score) ?? 0),
  );

  if (predictions.length === 0) {
    return (
      <section
        className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 ${className}`}>
        <p className="text-body text-[var(--text-muted)]">
          No picks for this match yet.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]  ${className}`}
      aria-label="Match insights">
      <div
        className="flex gap-1 overflow-x-auto border-b border-[var(--border-color)] p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              tab === t.id
                ? "bg-[var(--text-primary)] text-[var(--bg-card)]"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4" role="tabpanel">
        {tab === "reason" && (
          <div className="space-y-4">
            {sorted.map((p) => {
              const conf = normalizeConfidenceScore(p.confidence_score);
              return (
              <article
                key={p.id}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {formatMarketAndPick(p.prediction_type, p.predicted_value)}
                  </span>
                  {conf != null ? (
                    <span
                      className={`rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums ${confBg(conf)}`}>
                      {(conf * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="rounded-lg bg-[var(--bg-secondary)] px-2 py-0.5 text-xs font-medium tabular-nums text-[var(--text-muted)]">
                      —
                    </span>
                  )}
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                  {p.frontier_explanation?.trim() ||
                    "No written breakdown for this pick."}
                </p>
                <p className="mt-2 text-caption text-[var(--text-muted)]">
                  {formatDateTime(p.created_at)}
                </p>
              </article>
            );
            })}
          </div>
        )}

        {tab === "markets" && (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-3 py-2.5">Market</th>
                  <th className="px-3 py-2.5">Pick</th>
                  <th className="px-3 py-2.5 text-center">Conf.</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const conf = normalizeConfidenceScore(p.confidence_score);
                  return (
                  <tr
                    key={p.id}
                    className={`border-b border-[var(--border-color)] last:border-0 ${
                      i % 2 === 1 ? "bg-[var(--bg-secondary)]/40" : ""
                    }`}>
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">
                      {formatMarketLabel(p.prediction_type)}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                      {formatPickLabel(p.prediction_type, p.predicted_value)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {conf != null ? (
                        <span
                          className={`inline-block min-w-[2.75rem] rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${confBg(conf)}`}>
                          {(conf * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "confidence" && (
          <div>
            <p className="mb-3 text-caption text-[var(--text-muted)]">
              Model confidence, illustrative implied odds, and value proxy
              (staking / edge).
            </p>
            <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    <th className="px-3 py-2.5">Market type</th>
                    <th className="px-3 py-2.5 text-center">Probability</th>
                    <th className="px-3 py-2.5 text-right">Odds</th>
                    <th className="px-3 py-2.5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => {
                    const conf = normalizeConfidenceScore(p.confidence_score);
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-[var(--border-color)] last:border-0 ${
                          i % 2 === 1
                            ? "bg-violet-500/[0.06] dark:bg-violet-500/[0.08]"
                            : ""
                        }`}>
                        <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">
                          {formatMarketLabel(p.prediction_type)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {conf != null ? (
                            <span
                              className={`inline-block min-w-[3rem] rounded-md px-2 py-1 text-xs font-bold ${confBg(conf)}`}>
                              {(conf * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[var(--text-secondary)]">
                          {impliedOdds(conf)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="inline-flex items-center justify-end gap-1 tabular-nums font-medium text-[var(--text-primary)]">
                            {valueScore(p)}
                            <span
                              className="flex flex-col leading-none"
                              aria-hidden>
                              <Icon
                                icon="mdi:triangle"
                                className="h-2 w-2 text-emerald-500"
                              />
                              <Icon
                                icon="mdi:triangle"
                                className="h-2 w-2 -mt-0.5 rotate-180 text-rose-500"
                              />
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
