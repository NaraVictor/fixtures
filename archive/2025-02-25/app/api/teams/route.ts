import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/** GET /api/teams?q=search&league=slug - search teams for filter dropdown (public). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const leagueSlug = searchParams.get("league")?.trim();
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const supabase = createClient(await cookies());

  let query = supabase
    .from("teams")
    .select("id, name, slug, league:leagues(id, name, slug)")
    .order("name")
    .limit(limit);

  if (leagueSlug) {
    const { data: league } = await supabase.from("leagues").select("id").eq("slug", leagueSlug).single();
    if (league) query = query.eq("league_id", league.id);
  }

  const { data: teams, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let list = (teams ?? []) as Array<{ id: string; name: string; slug: string; league: { id: string; name: string; slug: string } | null }>;
  if (q) {
    const t = q.replace(/\s+/g, " ");
    list = list.filter(
      (team) =>
        team.name.toLowerCase().includes(t) || team.slug.toLowerCase().includes(t.replace(/\s+/g, "-"))
    );
  }

  return NextResponse.json(list);
}
