import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify, fixtureSlug } from "./adapter";
import { loadAllCsvCandidates } from "./csv-provider";
import { DIV_TO_LEAGUE } from "./league-map";

export async function ensureLeagues(supabase: SupabaseClient): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const [div, { name, slug }] of Object.entries(DIV_TO_LEAGUE)) {
    const { data: existing } = await supabase.from("leagues").select("id").eq("slug", slug).single();
    if (existing) {
      out.set(slug, existing.id);
      continue;
    }
    const { data: inserted, error } = await supabase.from("leagues").insert({ name, slug, is_active: true }).select("id").single();
    if (error) throw error;
    if (inserted) out.set(slug, inserted.id);
  }
  return out;
}

export async function ensureTeam(supabase: SupabaseClient, leagueId: string, name: string): Promise<string> {
  const slug = slugify(name) || "unknown";
  const { data: existing } = await supabase.from("teams").select("id").eq("league_id", leagueId).eq("slug", slug).single();
  if (existing) return existing.id;
  const { data: inserted, error } = await supabase
    .from("teams")
    .insert({ league_id: leagueId, name, slug })
    .select("id")
    .single();
  if (error) throw error;
  if (!inserted) throw new Error("Team insert failed");
  return inserted.id;
}

export async function ensureFixtureSlug(supabase: SupabaseClient, baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let n = 1;
  while (true) {
    const { data } = await supabase.from("fixtures").select("id").eq("slug", slug).single();
    if (!data) return slug;
    slug = `${baseSlug}-${++n}`;
  }
}

export async function importCsvToDb(supabase: SupabaseClient, options?: { dateFrom?: string; dateTo?: string }): Promise<{ fixturesCreated: number }> {
  const leagueIds = await ensureLeagues(supabase);
  const candidates = loadAllCsvCandidates();
  let fixturesCreated = 0;
  for (const c of candidates) {
    if (options?.dateFrom && c.fixtureDate < options.dateFrom) continue;
    if (options?.dateTo && c.fixtureDate > options.dateTo) continue;
    const leagueId = leagueIds.get(c.leagueSlug);
    if (!leagueId) continue;
    const homeTeamId = await ensureTeam(supabase, leagueId, c.homeTeamName);
    const awayTeamId = await ensureTeam(supabase, leagueId, c.awayTeamName);
    const homeSlug = slugify(c.homeTeamName) || "home";
    const awaySlug = slugify(c.awayTeamName) || "away";
    const baseSlug = fixtureSlug(c.leagueSlug, homeSlug, awaySlug, c.fixtureDate);
    const slug = await ensureFixtureSlug(supabase, baseSlug);
    const status = c.homeGoals != null && c.awayGoals != null ? "finished" : "scheduled";
    const startedAt = c.startedAt || null;
    let endedAt: string | null = null;
    if (status === "finished" && startedAt) {
      const end = new Date(new Date(startedAt).getTime() + 105 * 60 * 1000);
      endedAt = end.toISOString();
    }
    const { data: existing } = await supabase.from("fixtures").select("id").eq("slug", slug).single();
    if (existing) continue;
    const { error: fixErr } = await supabase.from("fixtures").insert({
      league_id: leagueId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      slug,
      started_at: startedAt,
      ended_at: endedAt,
      fixture_date: c.fixtureDate,
      status,
      home_goals: c.homeGoals ?? null,
      away_goals: c.awayGoals ?? null,
      half_time_home: c.halfTimeHome ?? null,
      half_time_away: c.halfTimeAway ?? null,
      raw_metadata: c.referee ? { referee: c.referee } : null,
    });
    if (fixErr) throw fixErr;
    fixturesCreated++;
  }
  return { fixturesCreated };
}
