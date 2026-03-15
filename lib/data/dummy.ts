import type {
  League,
  Team,
  Fixture,
  Prediction,
  FixtureLineup,
  FixtureAbsence,
  LeagueStanding,
  PredictionWithFixture,
  FixtureStatus,
} from "./types";

import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

function loadJsonSync<T>(file: string): T {
  const filePath = path.join(dataDir, `${file}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

let cache: {
  leagues?: League[];
  teams?: Team[];
  fixtures?: Fixture[];
  predictions?: Prediction[];
  lineups?: FixtureLineup[];
  absences?: FixtureAbsence[];
  standings?: LeagueStanding[];
} = {};

function getLeaguesSync(): League[] {
  if (!cache.leagues) cache.leagues = loadJsonSync<League[]>("leagues");
  return cache.leagues;
}

function getTeamsSync(): Team[] {
  if (!cache.teams) cache.teams = loadJsonSync<Team[]>("teams");
  return cache.teams;
}

function getFixturesSync(): Fixture[] {
  if (!cache.fixtures) cache.fixtures = loadJsonSync<Fixture[]>("fixtures");
  return cache.fixtures;
}

type RawPredictionFromJson = Omit<Prediction, "status"> & { status?: string };

function getPredictionsRawSync(): Prediction[] {
  if (!cache.predictions) {
    const raw = loadJsonSync<RawPredictionFromJson[]>("predictions");
    cache.predictions = raw.map((p) => {
      const s = p.status === "correct" ? "won" : p.status === "incorrect" ? "lost" : p.status;
      return { ...p, status: (s ?? "pending") as Prediction["status"] };
    });
  }
  return cache.predictions;
}

function getLineupsSync(): FixtureLineup[] {
  if (!cache.lineups) cache.lineups = loadJsonSync<FixtureLineup[]>("fixture-lineups");
  return cache.lineups;
}

function getAbsencesSync(): FixtureAbsence[] {
  if (!cache.absences) cache.absences = loadJsonSync<FixtureAbsence[]>("fixture-absences");
  return cache.absences;
}

function getStandingsSync(): LeagueStanding[] {
  if (!cache.standings) cache.standings = loadJsonSync<LeagueStanding[]>("league-standings");
  return cache.standings;
}

function teamById(teams: Team[], id: string): Team | null {
  return teams.find((t) => t.id === id) ?? null;
}

function leagueById(leagues: League[], id: string): League | null {
  return leagues.find((l) => l.id === id) ?? null;
}

/** Get all predictions with fixture, home/away team, league. Optional filters. */
export function getPredictionsWithFixtures(filters?: {
  status?: FixtureStatus;
  league?: string;
  marketType?: string;
  search?: string;
  sort?: "confidence_asc" | "confidence_desc" | "kickoff_asc" | "kickoff_desc";
}): PredictionWithFixture[] {
  const predictions = getPredictionsRawSync();
  const fixtures = getFixturesSync();
  const teams = getTeamsSync();
  const leagues = getLeaguesSync();

  const fixtureMap = new Map(fixtures.map((f) => [f.id, f]));
  let list: PredictionWithFixture[] = [];

  for (const p of predictions) {
    const fixture = fixtureMap.get(p.fixture_id);
    if (!fixture) continue;
    if (filters?.status && fixture.status !== filters.status) continue;

    const row = {
      ...p,
      fixture: {
        ...fixture,
        home_team: teamById(teams, fixture.home_team_id),
        away_team: teamById(teams, fixture.away_team_id),
        league: leagueById(leagues, fixture.league_id),
      },
    };

    if (filters?.league && row.fixture.league?.slug !== filters.league) continue;
    if (filters?.marketType && p.prediction_type !== filters.marketType) continue;

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const home = row.fixture.home_team?.name?.toLowerCase() ?? "";
      const away = row.fixture.away_team?.name?.toLowerCase() ?? "";
      const market = p.prediction_type?.toLowerCase() ?? "";
      const match = home.includes(q) || away.includes(q) || market.includes(q);
      if (!match) continue;
    }

    list.push(row);
  }

  const sort = filters?.sort ?? "kickoff_desc";
  if (sort === "confidence_asc") list.sort((a, b) => (a.confidence_score ?? 0) - (b.confidence_score ?? 0));
  else if (sort === "confidence_desc") list.sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0));
  else if (sort === "kickoff_asc") list.sort((a, b) => new Date(a.fixture.started_at ?? a.fixture.fixture_date).getTime() - new Date(b.fixture.started_at ?? b.fixture.fixture_date).getTime());
  else list.sort((a, b) => new Date(b.fixture.started_at ?? b.fixture.fixture_date).getTime() - new Date(a.fixture.started_at ?? a.fixture.fixture_date).getTime());

  return list;
}

/** Get a single fixture by slug with home/away team and league. */
export function getFixtureBySlug(slug: string): (Fixture & {
  home_team: Team | null;
  away_team: Team | null;
  league: League | null;
}) | null {
  const fixtures = getFixturesSync();
  const teams = getTeamsSync();
  const leagues = getLeaguesSync();
  const fixture = fixtures.find((f) => f.slug === slug);
  if (!fixture) return null;
  return {
    ...fixture,
    home_team: teamById(teams, fixture.home_team_id),
    away_team: teamById(teams, fixture.away_team_id),
    league: leagueById(leagues, fixture.league_id),
  };
}

/** Get predictions for a fixture. */
export function getPredictionsForFixture(fixtureId: string): Prediction[] {
  const predictions = getPredictionsRawSync();
  return predictions.filter((p) => p.fixture_id === fixtureId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Get lineups for a fixture (with team names and optional full line). */
export function getLineupsForFixture(fixtureId: string): Array<{
  formation: string | null;
  team_name: string;
  full_line: string[] | null;
}> {
  const lineups = getLineupsSync();
  const teams = getTeamsSync();
  return lineups
    .filter((l) => l.fixture_id === fixtureId)
    .map((l) => ({
      formation: l.formation,
      team_name: teamById(teams, l.team_id)?.name ?? "—",
      full_line: l.full_line ?? null,
    }));
}

/** Get absences for a fixture (with team names). */
export function getAbsencesForFixture(fixtureId: string): Array<{
  player_name_or_id: string | null;
  absence_type: string;
  impact_level: string;
  team_name: string;
}> {
  const absences = getAbsencesSync();
  const teams = getTeamsSync();
  return absences
    .filter((a) => a.fixture_id === fixtureId)
    .map((a) => ({
      player_name_or_id: a.player_name_or_id,
      absence_type: a.absence_type,
      impact_level: a.impact_level,
      team_name: teamById(teams, a.team_id)?.name ?? "—",
    }));
}

/** League accuracy: correct / total for predictions in that league (finished fixtures only). */
export function getLeagueAccuracy(leagueId: string): { correct: number; total: number } {
  const predictions = getPredictionsRawSync();
  const fixtures = getFixturesSync();
  const finishedFixtureIds = new Set(
    fixtures.filter((f) => f.league_id === leagueId && f.status === "finished").map((f) => f.id)
  );
  const relevant = predictions.filter(
    (p) => finishedFixtureIds.has(p.fixture_id) && (p.status === "won" || p.status === "lost")
  );
  return {
    correct: relevant.filter((r) => r.status === "won").length,
    total: relevant.length,
  };
}

/** All leagues for filters. */
export function getLeaguesList(): League[] {
  return getLeaguesSync();
}

export function getMarketTypesList(): string[] {
  const preds = getPredictionsRawSync();
  const set = new Set(preds.map((p) => p.prediction_type).filter(Boolean));
  return Array.from(set).sort();
}

/** Get league table position for a team (1-based), or null if not in standings. */
export function getTeamPosition(teamId: string, leagueId: string): number | null {
  const standings = getStandingsSync();
  const row = standings.find((s) => s.team_id === teamId && s.league_id === leagueId);
  return row ? row.position : null;
}
