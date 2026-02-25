import { createServiceClient } from "@/lib/supabase/server";
import { importCsvToDb } from "@/lib/data/import-csv";
import { ImportButton } from "./import-button";

export default async function ImportPage() {
  return (
    <div>
      <h1 className="text-xl font-bold">Import CSV</h1>
      <p className="mt-2 text-sm text-gray-600">
        Imports from the <code className="rounded bg-gray-100 px-1">data/</code> folder (football-data.co.uk format). Requires SUPABASE_SERVICE_ROLE_KEY.
      </p>
      <ImportButton />
    </div>
  );
}
