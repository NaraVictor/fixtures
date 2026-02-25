"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfigForm({
  configId,
  initial,
}: {
  configId: string;
  initial: Record<string, number>;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/office/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId, weights: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        setSaving(false);
        return;
      }
      router.refresh();
      setSaving(false);
    } catch {
      setError("Request failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Weights (0–1)</label>
        {["xg_weight", "form_weight", "h2h_weight", "home_advantage_weight", "shots_on_target_weight", "lineup_weight", "key_man_weight"].map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-48 text-sm text-gray-600">{key.replace(/_/g, " ")}</span>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={values[key] ?? 0}
              onChange={(e) => setValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
              className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="grid gap-2 border-t border-gray-200 pt-4">
        <label className="text-sm font-medium">Daily picks</label>
        <div className="flex items-center gap-2">
          <span className="w-48 text-sm text-gray-600">num_picks</span>
          <input
            type="number"
            min="1"
            max="20"
            value={values.num_picks ?? 10}
            onChange={(e) => setValues((v) => ({ ...v, num_picks: Number(e.target.value) }))}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-48 text-sm text-gray-600">min_odds (0 = off)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={values.min_odds ?? 0}
            onChange={(e) => setValues((v) => ({ ...v, min_odds: Number(e.target.value) }))}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-48 text-sm text-gray-600">max_odds (0 = off)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={values.max_odds ?? 0}
            onChange={(e) => setValues((v) => ({ ...v, max_odds: Number(e.target.value) }))}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
