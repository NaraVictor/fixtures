"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import type { PredictionWithFixture } from "@/lib/data/types";
import { MatchListRow } from "@/components/match-list-row";
import { MatchListTable } from "@/components/match-list-table";

type ListView = "cards" | "table";

const STORAGE_KEY = "gg_match_list_view";

export function MatchList({
  predictions,
}: {
  predictions: PredictionWithFixture[];
}) {
  const [view, setViewState] = useState<ListView>("cards");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ListView | null;
    if (stored === "cards" || stored === "table") setViewState(stored);
  }, []);

  const setView = useCallback((v: ListView) => {
    setViewState(v);
    localStorage.setItem(STORAGE_KEY, v);
  }, []);

  return (
    <div className="space-y-3">
      <div
        className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4"
        role="toolbar"
        aria-label="Match list display">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Matches
        </span>
        <div className="inline-flex rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5">
          <button
            type="button"
            onClick={() => setView("cards")}
            aria-pressed={view === "cards"}
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:min-h-9 sm:gap-1.5 ${
              view === "cards"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-label="Card view"
            title="Card view">
            <Icon
              icon="solar:widget-4-bold-duotone"
              className="h-5 w-5"
              aria-hidden
            />
            <span className="hidden sm:inline text-xs font-medium">Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:min-h-9 sm:gap-1.5 ${
              view === "table"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-label="Table view"
            title="Table view">
            <Icon
              icon="solar:table-bold-duotone"
              className="h-5 w-5"
              aria-hidden
            />
            <span className="hidden sm:inline text-xs font-medium">Table</span>
          </button>
        </div>
      </div>

      {view === "cards" ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2" role="list">
          {predictions.map((p) => (
            <MatchListRow key={p.id} p={p} />
          ))}
        </ul>
      ) : (
        <MatchListTable predictions={predictions} />
      )}
    </div>
  );
}
