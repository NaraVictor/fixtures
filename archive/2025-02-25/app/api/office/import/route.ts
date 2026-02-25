import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { importCsvToDb } from "@/lib/data/import-csv";

function isAdmin(user: { email?: string | null; app_metadata?: { role?: string } }): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];
  const role = user.app_metadata?.role;
  return role === "admin" || (adminEmails.length > 0 && user.email && adminEmails.includes(user.email.toLowerCase()));
}

export async function POST() {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const service = createServiceClient();
    const result = await importCsvToDb(service);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
