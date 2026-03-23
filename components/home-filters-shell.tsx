"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  children: React.ReactNode;
};

export function HomeFiltersShell({ leagues, marketTypes, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
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
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [searchParams, pathname],
  );

  const pushUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      startTransition(() =>
        router.push(buildUrl(updates), { scroll: false }),
      );
    },
    [router, buildUrl],
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
    [pushUrl],
  );

  const isConfidence = sort.startsWith("confidence_");
  const isKickoff = sort.startsWith("kickoff_");
  const confidenceDir = sort === "confidence_desc" ? "desc" : "asc";
  const kickoffDir = sort === "kickoff_desc" ? "desc" : "asc";

  const setSort = useCallback(
    (key: "confidence" | "kickoff", nextDir?: "asc" | "desc") => {
      if (key === "confidence") {
        const dir =
          nextDir ??
          (isConfidence && confidenceDir === "desc" ? "asc" : "desc");
        pushUrl({
          sort: dir === "desc" ? "confidence_desc" : "confidence_asc",
        });
      } else {
        const dir =
          nextDir ?? (isKickoff && kickoffDir === "desc" ? "asc" : "desc");
        pushUrl({
          sort: dir === "desc" ? "kickoff_desc" : "kickoff_asc",
        });
      }
    },
    [isConfidence, isKickoff, confidenceDir, kickoffDir, pushUrl],
  );

  return (
    <>
      <section className="mb-6 space-y-4" aria-label="Filter and sort picks">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search teams</span>
            <input
              type="search"
              placeholder="Search teams…"
              defaultValue={q}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] sm:min-h-0 sm:py-2 sm:text-sm"
              aria-label="Search by team name"
            />
          </label>
          <label className="shrink-0 sm:w-44">
            <span className="sr-only">Market type</span>
            <select
              value={marketType}
              onChange={(e) =>
                pushUrl({ marketType: e.target.value || undefined })
              }
              className="min-h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] sm:min-h-0 sm:py-2 sm:text-sm"
            >
              <option value="">All markets</option>
              {marketTypes.map((m) => (
                <option key={m} value={m}>
                  {formatMarketLabel(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
          <div className="min-w-0 flex-1">
            <span
              id="filter-league-label"
              className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]"
            >
              League
            </span>
            <div
              className="chip-row flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-labelledby="filter-league-label"
            >
              <Chip
                label="All"
                active={!league}
                onSelect={() => pushUrl({ league: undefined })}
              />
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
          <div className="min-w-0 flex-1">
            <span
              id="filter-status-label"
              className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]"
            >
              Status
            </span>
            <div
              className="chip-row flex gap-2 overflow-x-auto pb-1"
              role="group"
              aria-labelledby="filter-status-label"
            >
              {STATUS_OPTIONS.map((o) => (
                <Chip
                  key={o.value || "all"}
                  label={o.label}
                  active={status === o.value}
                  onSelect={() =>
                    pushUrl({ status: (o.value as FixtureStatus) || undefined })
                  }
                />
              ))}
            </div>
          </div>
          <div className="min-w-0 shrink-0 lg:max-w-none">
            <span
              id="filter-sort-label"
              className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]"
            >
              Sort
            </span>
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-labelledby="filter-sort-label"
            >
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
        </div>

        {isPending && (
          <span className="sr-only" aria-live="polite">
            Updating results…
          </span>
        )}
      </section>

      <div id="matches">{children}</div>
    </>
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
      aria-label={`Sort by ${label}, ${dir === "desc" ? "highest first" : "lowest first"}`}
      className={`chip chip--md flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] sm:min-h-0 ${
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
      className={`chip chip--md min-h-11 shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] sm:min-h-0 ${
        active
          ? "bg-[var(--color-primary)] text-white"
          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
      }`}
    >
      {label}
    </button>
  );
}
