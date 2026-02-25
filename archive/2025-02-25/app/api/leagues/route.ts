import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from("leagues")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
