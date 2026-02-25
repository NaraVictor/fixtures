"use client";

import { useState } from "react";

export function ImportButton() {
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setMsg("Importing…");
    try {
      const res = await fetch("/api/office/import", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error || "Import failed");
      else setMsg(`Created ${data.fixturesCreated ?? 0} fixtures.`);
    } catch (e) {
      setMsg(String(e));
    }
  }
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={run}
        className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
      >
        Run import
      </button>
      {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
