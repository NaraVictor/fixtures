import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { secureCompare } from "@/lib/auth/secure-compare";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !secureCompare(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const { data: pending } = await supabase
      .from("predictions")
      .select("id, fixture_id, prediction_type, predicted_value")
      .eq("status", "pending");
    if (!pending?.length) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    const fixtureIds = Array.from(new Set(pending.map((p) => p.fixture_id)));

    const { data: fixtures } = await supabase
      .from("fixtures")
      .select("id, status, ended_at, home_goals, away_goals")
      .in("id", fixtureIds)
      .eq("status", "finished")
      .not("home_goals", "is", null)
      .not("away_goals", "is", null);

    const byId = new Map((fixtures ?? []).map((f) => [f.id, f]));

    let updated = 0;
    for (const p of pending) {
      const f = byId.get(p.fixture_id);
      if (!f) continue;
      let status: "correct" | "incorrect" | "void" = "void";
      if (p.prediction_type === "1x2" && p.predicted_value === "1") {
        status =
          (f.home_goals ?? 0) > (f.away_goals ?? 0) ? "correct" : "incorrect";
      } else if (p.prediction_type === "1x2" && p.predicted_value === "X") {
        status =
          (f.home_goals ?? 0) === (f.away_goals ?? 0) ? "correct" : "incorrect";
      } else if (p.prediction_type === "1x2" && p.predicted_value === "2") {
        status =
          (f.away_goals ?? 0) > (f.home_goals ?? 0) ? "correct" : "incorrect";
      }
      await supabase
        .from("predictions")
        .update({
          status,
          updated_at: now,
          actual_result: { home_goals: f.home_goals, away_goals: f.away_goals },
        })
        .eq("id", p.id);
      updated++;
      if (!f.ended_at) {
        await supabase
          .from("fixtures")
          .update({ ended_at: now })
          .eq("id", p.fixture_id);
      }
    }
    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
