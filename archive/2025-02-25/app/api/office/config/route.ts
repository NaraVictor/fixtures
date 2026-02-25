import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];
  const role = (user as { app_metadata?: { role?: string } })?.app_metadata?.role;
  const isAdmin = role === "admin" || (adminEmails.length > 0 && user.email && adminEmails.includes(user.email.toLowerCase()));
  if (adminEmails.length > 0 && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { configId, weights } = body as { configId?: string; weights?: Record<string, unknown> };
  if (!configId || !weights || typeof weights !== "object" || Array.isArray(weights)) {
    return NextResponse.json({ error: "configId and weights required" }, { status: 400 });
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(String(configId))) {
    return NextResponse.json({ error: "Invalid configId" }, { status: 400 });
  }
  const allowedKeys = new Set([
    "xg_weight", "form_weight", "h2h_weight", "home_advantage_weight",
    "shots_on_target_weight", "lineup_weight", "key_man_weight",
    "num_picks", "min_odds", "max_odds",
  ]);
  const sanitized: Record<string, number> = {};
  for (const [k, v] of Object.entries(weights)) {
    if (allowedKeys.has(k) && typeof v === "number" && Number.isFinite(v)) {
      if (k === "num_picks") sanitized[k] = Math.max(1, Math.min(20, Math.round(v)));
      else if (k.endsWith("_weight")) sanitized[k] = Math.max(0, Math.min(1, v));
      else if (k === "min_odds" || k === "max_odds") sanitized[k] = Math.max(0, v);
      else sanitized[k] = v;
    }
  }

  const service = createServiceClient();
  const { data: existing } = await service.from("ranking_config").select("weights").eq("id", configId).single();
  const prev = (existing?.weights as Record<string, number> | undefined) ?? {};
  const merged: Record<string, number> = {};
  for (const k of allowedKeys) {
    if (k in sanitized) merged[k] = sanitized[k];
    else if (typeof prev[k] === "number" && Number.isFinite(prev[k])) merged[k] = prev[k];
  }
  const { error } = await service
    .from("ranking_config")
    .update({ weights: merged })
    .eq("id", configId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
