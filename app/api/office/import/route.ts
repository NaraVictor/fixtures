import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { importCsvToDb } from "@/lib/data/import-csv";

export async function POST() {
  try {
    const supabase = createServiceClient();
    const result = await importCsvToDb(supabase);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
