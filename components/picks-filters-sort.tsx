"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Icon } from "@iconify/react";
import type { FixtureStatus } from "@/lib/data/types";
import { formatMarketLabel } from "@/lib/format";

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

type Props = {
  leagues: { id: string; slug: string; name: string }[];
  marketTypes: string[];
};

export function PicksFiltersSort({ leagues, marketTypes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const buildUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      return qs ? `/?${qs}` : "/";
    },
    [searchParams]
  );

  const pushUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      startTransition(() => router.push(buildUrl(updates)));
    },
    [router, buildUrl]
  );

  const league = searchParams.get("league") ?? "";
  const status = searchParams.get("status") ?? "";
  const marketType = searchParams.get("marketType") ?? "";
  const sort = searchParams.get("sort") ?? "kickoff_desc";
  const q = searchParams.get("q") ?? "";
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSearchChange = useCallback(
    (value: string) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        pushUrl({ q: value.trim() || undefined });
        searchTimeoutRef.current = null;
      }, SEARCH_DEBOUNCE_MS);
    },
    [pushUrl]
  );

  const isConfidence = sort.startsWith("confidence_");
  const isKickoff = sort.startsWith("kickoff_");
  const confidenceDir = sort === "confidence_desc" ? "desc" : "asc";
  const kickoffDir = sort === "kickoff_desc" ? "desc" : "asc";

  const setSort = useCallback(
    (key: "confidence" | "kickoff", nextDir?: "asc" | "desc") => {
      if (key === "confidence") {
        const dir = nextDir ?? (isConfidence && confidenceDir === "desc" ? "asc" : "desc");
        pushUrl({ sort: dir === "desc" ? "confidence_desc" : "confidence_asc" });
      } else {
        const dir = nextDir ?? (isKickoff && kickoffDir === "desc" ? "asc" : "desc");
        pushUrl({ sort: dir === "desc" ? "kickoff_desc" : "kickoff_asc" });
      }
    },
    [isConfidence, isKickoff, confidenceDir, kickoffDir, pushUrl]
  );

  return (
    <section className="mb-6 space-y-4" aria-label="Filter and sort picks">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search by team or market</span>
          <input
            type="search"
            placeholder="Team or market…"
            defaultValue={q}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            aria-label="Search by team name or market"
          />
        </label>
        <label className="shrink-0 sm:w-44">
          <span className="sr-only">Market type</span>
          <select
            value={marketType}
            onChange={(e) => pushUrl({ marketType: e.target.value || undefined })}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            <option value="">All markets</option>
            {marketTypes.map((m) => (
              <option key={m} value={m}>
                {formatMarketLabel(m)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex shrink-0 items-center gap-2" role="group" aria-label="Sort by">
          <SortToggle
            label="Confidence"
            active={isConfidence}
            dir={confidenceDir}
            onClick={() => setSort("confidence")}
          />
          <SortToggle
            label="Kick-off"
            active={isKickoff}
            dir={kickoffDir}
            onClick={() => setSort("kickoff")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">League</span>
          <div className="chip-row flex gap-2 overflow-x-auto pb-1">
            <Chip label="All" active={!league} onSelect={() => pushUrl({ league: undefined })} />
            {leagues.map((l) => (
              <Chip
                key={l.id}
                label={l.name}
                active={league === l.slug}
                onSelect={() => pushUrl({ league: l.slug })}
              />
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Status</span>
          <div className="chip-row flex gap-2 overflow-x-auto pb-1">
            {STATUS_OPTIONS.map((o) => (
              <Chip
                key={o.value || "all"}
                label={o.label}
                active={status === o.value}
                onSelect={() => pushUrl({ status: (o.value as FixtureStatus) || undefined })}
              />
            ))}
          </div>
        </div>
      </div>

      {isPending && (
        <span className="sr-only" aria-live="polite">
          Updating…
        </span>
      )}
    </section>
  );
}

function SortToggle({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Sort by ${label} ${dir === "desc" ? "high to low" : "low to high"}`}
      className={`chip chip--md flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
        active
          ? "bg-[var(--color-primary)] text-white"
          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
      }`}
    >
      <span>{label}</span>
      <Icon
        icon={dir === "desc" ? "mdi:arrow-down" : "mdi:arrow-up"}
        className="h-4 w-4"
        aria-hidden
      />
    </button>
  );
}

function Chip({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`chip chip--md shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${
        active
          ? "bg-[var(--color-primary)] text-white"
          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
      }`}
    >
      {label}
    </button>
  );
}
