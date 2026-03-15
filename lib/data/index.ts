/**
 * Data layer: currently dummy (JSON files in /data).
 * When reconnecting to Supabase, add supabase.ts implementing the same exports
 * and switch this file to re-export from supabase instead of dummy.
 */
export {
  getPredictionsWithFixtures,
  getFixtureBySlug,
  getPredictionsForFixture,
  getLineupsForFixture,
  getAbsencesForFixture,
  getLeagueAccuracy,
  getLeaguesList,
  getMarketTypesList,
  getTeamPosition,
} from "./dummy";
export type { FixtureStatus, PredictionStatus } from "./types";
