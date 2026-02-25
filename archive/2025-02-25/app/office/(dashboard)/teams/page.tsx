import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TeamsList } from "./teams-list";

export default async function TeamsPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/office/login");

  const { data: teams } = await supabase
    .from("teams")
    .select(
      "id, name, slug, short_name, league_id, league:leagues(id, name, slug)",
    )
    .order("name")
    .limit(500);

  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  const rows = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    short_name: t.short_name,
    league_id: t.league_id,
    league_name: Array.isArray(t.league)
      ? t.league[0]?.name
      : (t.league as { name: string } | null)?.name,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold">Teams</h1>
      <p className="mt-2 text-gray-600">
        List and edit teams. Merge and external_id management coming later.
      </p>
      <TeamsList teams={rows} leagues={leagues ?? []} />
    </div>
  );
}
