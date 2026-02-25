import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FixtureOddsProvider,
  FixtureCandidate,
  LineupInfo,
  AbsenceInfo,
} from "./adapter";
import type { FixtureStatus } from "@/lib/db/types";

const BASE = "https://v3.football.api-sports.io";

type ApiFixture = {
  fixture: { id: number; date: string; status?: { short?: string } };
  league: { id: number; name: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
  score?: { halftime?: { home: number | null; away: number | null } };
};

type ApiLineup = {
  team: { id: number };
  formation?: string;
  startXI?: Array<{ player: { id: number; name: string }; grid?: string }>;
  [k: string]: unknown;
};

type ApiInjury = {
  player: { id: number; name: string };
  team: { id: number };
  fixture: { id: number };
  type?: string;
  [k: string]: unknown;
};

function leagueIdToSlug(leagueId: number): string {
  const map: Record<number, string> = {
    39: "epl",
    40: "championship",
    41: "league-one",
    42: "league-two",
  };
  return map[leagueId] ?? `league-${leagueId}`;
}

async function apiGet<T>(
  key: string,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": key },
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as { response?: T };
  return json.response as T;
}

export interface ApiFootballProviderOptions {
  apiKey: string;
  supabase: SupabaseClient;
}

export function createApiFootballProvider(
  opts: ApiFootballProviderOptions,
): FixtureOddsProvider {
  const { apiKey, supabase } = opts;

  async function getExternalFixtureId(
    internalId: string,
  ): Promise<string | null> {
    const { data } = await supabase
      .from("fixtures")
      .select("api_external_id")
      .eq("id", internalId)
      .single();
    return data?.api_external_id ?? null;
  }

  async function resolveTeamIdByApiId(
    apiTeamId: number,
  ): Promise<string | null> {
    const { data } = await supabase
      .from("teams")
      .select("id")
      .eq("api_external_id", String(apiTeamId))
      .single();
    return data?.id ?? null;
  }

  return {
    async getFixturesByDate(date: string): Promise<FixtureCandidate[]> {
      const raw = await apiGet<ApiFixture[]>(apiKey, "/fixtures", { date });
      if (!Array.isArray(raw)) return [];
      return raw.map((r) => {
        const leagueSlug = leagueIdToSlug(r.league.id);
        const d = r.fixture.date.slice(0, 10);
        return {
          leagueSlug,
          homeTeamName: r.teams.home.name,
          awayTeamName: r.teams.away.name,
          fixtureDate: d,
          homeGoals: r.goals?.home ?? undefined,
          awayGoals: r.goals?.away ?? undefined,
          halfTimeHome: r.score?.halftime?.home ?? undefined,
          halfTimeAway: r.score?.halftime?.away ?? undefined,
        };
      });
    },

    async getResultsForFixture(
      externalId: string,
    ): Promise<{
      homeGoals: number;
      awayGoals: number;
      status: FixtureStatus;
    } | null> {
      const raw = await apiGet<ApiFixture[]>(apiKey, "/fixtures", {
        id: externalId,
      });
      const r = Array.isArray(raw) ? raw[0] : null;
      if (!r?.goals) return null;
      const statusShort = r.fixture?.status?.short;
      let status: FixtureStatus = "scheduled";
      if (
        statusShort === "FT" ||
        statusShort === "AET" ||
        statusShort === "PEN"
      )
        status = "finished";
      else if (
        statusShort === "1H" ||
        statusShort === "2H" ||
        statusShort === "HT" ||
        statusShort === "ET"
      )
        status = "live";
      return {
        homeGoals: r.goals.home ?? 0,
        awayGoals: r.goals.away ?? 0,
        status,
      };
    },

    async getOddsForFixture(): Promise<
      { marketType: string; outcomeLabel: string; oddsValue: number }[]
    > {
      return [];
    },

    async getLineupsForFixture(fixtureId: string): Promise<LineupInfo[]> {
      const extId = await getExternalFixtureId(fixtureId);
      if (!extId) return [];
      const raw = await apiGet<ApiLineup[]>(apiKey, "/fixtures/lineups", {
        fixture: extId,
      });
      if (!Array.isArray(raw)) return [];
      const out: LineupInfo[] = [];
      for (const row of raw) {
        const teamId = await resolveTeamIdByApiId(row.team.id);
        if (!teamId) continue;
        out.push({
          teamId,
          formation: row.formation ?? "?",
          raw: row as unknown as Record<string, unknown>,
        });
      }
      return out;
    },

    async getAbsencesForFixture(fixtureId: string): Promise<AbsenceInfo[]> {
      const extId = await getExternalFixtureId(fixtureId);
      if (!extId) return [];
      const raw = await apiGet<ApiInjury[]>(apiKey, "/injuries", {
        fixture: extId,
      });
      if (!Array.isArray(raw)) return [];
      const out: AbsenceInfo[] = [];
      for (const row of raw) {
        const teamId = await resolveTeamIdByApiId(row.team.id);
        if (!teamId) continue;
        const t = (row.type ?? "").toLowerCase();
        const absenceType: AbsenceInfo["absenceType"] = t.includes("suspension")
          ? "suspension"
          : t.includes("rest")
            ? "rest"
            : t.includes("international")
              ? "international"
              : "injury";
        out.push({
          teamId,
          playerNameOrId: row.player?.name ?? String(row.player?.id ?? ""),
          absenceType,
          impactLevel: "medium",
        });
      }
      return out;
    },
  };
}

const SOURCE = "api-football";

export async function syncRealtimeForFixture(
  supabase: SupabaseClient,
  provider: FixtureOddsProvider,
  fixtureId: string,
): Promise<{ lineups: number; absences: number }> {
  await supabase.from("fixture_lineups").delete().eq("fixture_id", fixtureId);
  await supabase.from("fixture_absences").delete().eq("fixture_id", fixtureId);

  let lineups = 0;
  if (provider.getLineupsForFixture) {
    const rows = await provider.getLineupsForFixture(fixtureId);
    if (rows.length) {
      const { error } = await supabase.from("fixture_lineups").insert(
        rows.map((r) => ({
          fixture_id: fixtureId,
          team_id: r.teamId,
          formation: r.formation,
          source: SOURCE,
          raw_metadata: r.raw ?? null,
        })),
      );
      if (!error) lineups = rows.length;
    }
  }

  let absences = 0;
  if (provider.getAbsencesForFixture) {
    const rows = await provider.getAbsencesForFixture(fixtureId);
    if (rows.length) {
      const { error } = await supabase.from("fixture_absences").insert(
        rows.map((r) => ({
          fixture_id: fixtureId,
          team_id: r.teamId,
          player_name_or_id: r.playerNameOrId,
          absence_type: r.absenceType,
          impact_level: r.impactLevel,
          source: SOURCE,
        })),
      );
      if (!error) absences = rows.length;
    }
  }

  return { lineups, absences };
}
