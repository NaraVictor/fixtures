import type { Fixture, FixtureStatus } from "@/lib/db/types";

export interface FixtureCandidate {
  leagueSlug: string;
  homeTeamName: string;
  awayTeamName: string;
  fixtureDate: string;
  time?: string;
  startedAt?: string;
  homeGoals?: number;
  awayGoals?: number;
  halfTimeHome?: number;
  halfTimeAway?: number;
  referee?: string;
  shotsHome?: number;
  shotsAway?: number;
  shotsOnTargetHome?: number;
  shotsOnTargetAway?: number;
  cornersHome?: number;
  cornersAway?: number;
  odds1x2?: { home: number; draw: number; away: number };
  oddsOverUnder25?: { over: number; under: number };
}

export interface LineupInfo {
  teamId: string;
  formation: string;
  raw?: Record<string, unknown>;
}

export interface AbsenceInfo {
  teamId: string;
  playerNameOrId: string;
  absenceType: "injury" | "suspension" | "rest" | "international";
  impactLevel: "key" | "high" | "medium" | "low";
}

export interface FixtureOddsProvider {
  getFixturesByDate(date: string): Promise<FixtureCandidate[]>;
  getResultsForFixture(externalId: string): Promise<{ homeGoals: number; awayGoals: number; status: FixtureStatus } | null>;
  getOddsForFixture(fixtureId: string): Promise<{ marketType: string; outcomeLabel: string; oddsValue: number }[]>;
  getLineupsForFixture?(fixtureId: string): Promise<LineupInfo[]>;
  getAbsencesForFixture?(fixtureId: string): Promise<AbsenceInfo[]>;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function fixtureSlug(leagueSlug: string, homeSlug: string, awaySlug: string, date: string): string {
  const d = date.replace(/-/g, "");
  return `${leagueSlug}-${homeSlug}-vs-${awaySlug}-${d}`;
}
