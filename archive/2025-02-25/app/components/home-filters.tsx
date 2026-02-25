"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type League = { id: string; name: string; slug: string };

function buildQuery(params: { status?: string; league?: string[]; team?: string }) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.league?.length) sp.set("league", params.league.join(","));
  if (params.team) sp.set("team", params.team);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function HomeFilters({
  leagues,
  currentLeagueSlugs,
  currentTeamSlug,
  currentTeamName,
  currentStatus,
}: {
  leagues: League[];
  currentLeagueSlugs: string[];
  currentTeamSlug: string | null;
  currentTeamName?: string;
  currentStatus: string | null;
}) {
  const router = useRouter();
  const [teamSearch, setTeamSearch] = useState("");
  const [teamOptions, setTeamOptions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [teamSlug, setTeamSlug] = useState<string | null>(currentTeamSlug);
  const [openTeam, setOpenTeam] = useState(false);

  const toggleLeague = useCallback(
    (slug: string) => {
      const next = currentLeagueSlugs.includes(slug)
        ? currentLeagueSlugs.filter((s) => s !== slug)
        : [...currentLeagueSlugs, slug];
      const q = buildQuery({
        status: currentStatus ?? undefined,
        league: next.length ? next : undefined,
        team: teamSlug ?? undefined,
      });
      router.push(q || "/");
    },
    [currentLeagueSlugs, currentStatus, teamSlug, router]
  );

  const setTeam = useCallback(
    (slug: string | null) => {
      setTeamSlug(slug);
      setOpenTeam(false);
      const q = buildQuery({
        status: currentStatus ?? undefined,
        league: currentLeagueSlugs.length ? currentLeagueSlugs : undefined,
        team: slug ?? undefined,
      });
      router.push(q || "/");
    },
    [currentStatus, currentLeagueSlugs, router]
  );

  useEffect(() => {
    if (!teamSearch.trim()) {
      setTeamOptions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(
        `/api/teams?q=${encodeURIComponent(teamSearch)}&limit=15`
      )
        .then((r) => r.json())
        .then((data) => setTeamOptions(Array.isArray(data) ? data : []))
        .catch(() => setTeamOptions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [teamSearch]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-600">Status:</span>
      <div className="flex flex-wrap gap-1">
        <Link
          href={buildQuery({ league: currentLeagueSlugs.length ? currentLeagueSlugs : undefined, team: teamSlug ?? undefined })}
          className={`rounded px-3 py-1 text-sm ${!currentStatus ? "bg-gray-800 text-white" : "bg-gray-200"}`}
        >
          All
        </Link>
        {["scheduled", "live", "finished"].map((s) => (
          <Link
            key={s}
            href={
              currentStatus === s
                ? buildQuery({ league: currentLeagueSlugs.length ? currentLeagueSlugs : undefined, team: teamSlug ?? undefined })
                : buildQuery({ status: s, league: currentLeagueSlugs.length ? currentLeagueSlugs : undefined, team: teamSlug ?? undefined })
            }
            className={`rounded px-3 py-1 text-sm capitalize ${currentStatus === s ? "bg-gray-800 text-white" : "bg-gray-200"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <span className="ml-4 text-sm font-medium text-gray-600">League:</span>
      <div className="flex flex-wrap gap-1">
        {leagues.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => toggleLeague(l.slug)}
            className={`rounded px-3 py-1 text-sm ${currentLeagueSlugs.includes(l.slug) ? "bg-gray-800 text-white" : "bg-gray-200"}`}
          >
            {l.name}
          </button>
        ))}
      </div>

      <span className="ml-4 text-sm font-medium text-gray-600">Team:</span>
      <div className="relative">
        <input
          type="text"
          placeholder="Search team..."
          value={teamSlug ? (currentTeamName ?? teamOptions.find((t) => t.slug === teamSlug)?.name ?? teamSlug) : teamSearch}
          onChange={(e) => {
            const v = e.target.value;
            setTeamSearch(v);
            if (!v) setTeam(null);
          }}
          onFocus={() => setOpenTeam(true)}
          onBlur={() => setTimeout(() => setOpenTeam(false), 150)}
          className="rounded border border-gray-300 px-2 py-1 text-sm w-40"
        />
        {openTeam && (teamSearch || !teamSlug) && (
          <ul className="absolute left-0 top-full z-10 mt-1 max-h-48 w-56 overflow-auto rounded border border-gray-200 bg-white py-1 shadow">
            {!teamSearch && teamSlug && (
              <li>
                <button
                  type="button"
                  className="w-full px-2 py-1 text-left text-sm hover:bg-gray-100"
                  onClick={() => setTeam(null)}
                >
                  Clear
                </button>
              </li>
            )}
            {teamOptions.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="w-full px-2 py-1 text-left text-sm hover:bg-gray-100"
                  onClick={() => setTeam(t.slug)}
                >
                  {t.name}
                </button>
              </li>
            ))}
            {teamSearch && teamOptions.length === 0 && (
              <li className="px-2 py-1 text-sm text-gray-500">No teams found</li>
            )}
          </ul>
        )}
        {teamSlug && (
          <button
            type="button"
            className="ml-1 text-sm text-gray-500 hover:underline"
            onClick={() => setTeam(null)}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
