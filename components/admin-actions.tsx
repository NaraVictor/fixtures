"use client";

import { useState } from "react";

type ActionKind = "load" | "update" | null;

export function AdminActions() {
  const [loading, setLoading] = useState<ActionKind>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(path: string, kind: ActionKind) {
    setLoading(kind);
    setMessage(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || `Request failed (${res.status})`;
        const retry = data.retryAfterSeconds != null ? ` Retry after ${data.retryAfterSeconds}s.` : "";
        throw new Error(msg + retry);
      }
      setMessage(data.message || "Done.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="mb-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => run("/api/admin/load-fixtures", "load")}
        disabled={loading !== null}
        className="rounded bg-primary px-3 py-1 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
        {loading === "load" ? "Loading fixtures…" : "Load Fixtures"}
      </button>
      <button
        type="button"
        onClick={() => run("/api/admin/update-fixtures", "update")}
        disabled={loading !== null}
        className="rounded border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50">
        {loading === "update" ? "Updating fixtures…" : "Update Fixtures"}
      </button>
      {message && <span className="text-xs text-gray-600">{message}</span>}
    </section>
  );
}
