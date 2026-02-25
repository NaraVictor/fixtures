import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConfigForm } from "./config-form";

const WEIGHT_KEYS = [
  "xg_weight",
  "form_weight",
  "h2h_weight",
  "home_advantage_weight",
  "shots_on_target_weight",
  "lineup_weight",
  "key_man_weight",
] as const;
const EXTRA_KEYS = ["num_picks", "min_odds", "max_odds"] as const;

export default async function ConfigPage() {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/office/login");

  const { data: config } = await supabase
    .from("ranking_config")
    .select("id, name, is_active, weights")
    .eq("is_active", true)
    .single();

  const weights = (config?.weights ?? {}) as Record<string, number>;
  const initial: Record<string, number> = {};
  for (const k of WEIGHT_KEYS) {
    initial[k] = typeof weights[k] === "number" ? weights[k] : 0.1;
  }
  initial.num_picks = typeof weights.num_picks === "number" ? weights.num_picks : 10;
  initial.min_odds = typeof weights.min_odds === "number" ? weights.min_odds : 0;
  initial.max_odds = typeof weights.max_odds === "number" ? weights.max_odds : 0;

  return (
    <div>
      <h1 className="text-xl font-bold">Ranking config</h1>
      <p className="mt-2 text-gray-600">Weights and daily pick settings. Only the active config is shown.</p>
      {config ? (
        <ConfigForm configId={config.id} initial={initial} />
      ) : (
        <p className="mt-4 text-sm text-amber-600">No active ranking config. Create one in the database.</p>
      )}
    </div>
  );
}
