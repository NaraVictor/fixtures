import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const { name, slug, league_id } = body as { name?: string; slug?: string; league_id?: string | null };
  const updates: Record<string, unknown> = {};
  const MAX_NAME = 200;
  const MAX_SLUG = 100;
  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (typeof name === "string") {
    const t = name.trim();
    if (t.length > MAX_NAME) {
      return NextResponse.json({ error: `name max length ${MAX_NAME}` }, { status: 400 });
    }
    if (t.length) updates.name = t;
  }
  if (typeof slug === "string") {
    const s = slug.trim().toLowerCase();
    if (s.length > MAX_SLUG) {
      return NextResponse.json({ error: `slug max length ${MAX_SLUG}` }, { status: 400 });
    }
    if (!SLUG_REGEX.test(s)) {
      return NextResponse.json({ error: "slug must be lowercase alphanumeric and hyphens only" }, { status: 400 });
    }
    updates.slug = s;
  }
  if (league_id !== undefined) updates.league_id = league_id || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service.from("teams").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
