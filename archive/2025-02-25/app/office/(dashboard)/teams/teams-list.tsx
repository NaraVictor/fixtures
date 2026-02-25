"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TeamRow = { id: string; name: string; slug: string; short_name: string | null; league_id: string | null; league_name: string | null };
type League = { id: string; name: string; slug: string };

export function TeamsList({ teams, leagues }: { teams: TeamRow[]; leagues: League[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editLeagueId, setEditLeagueId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(t: TeamRow) {
    setEditing(t.id);
    setEditName(t.name);
    setEditSlug(t.slug);
    setEditLeagueId(t.league_id);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/office/teams/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, slug: editSlug, league_id: editLeagueId || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Failed to save");
      } else {
        setEditing(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(null);
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full max-w-3xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Slug</th>
            <th className="py-2 pr-4">League</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.id} className="border-b border-gray-100">
              {editing === t.id ? (
                <>
                  <td className="py-2 pr-4">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      value={editLeagueId ?? ""}
                      onChange={(e) => setEditLeagueId(e.target.value || null)}
                      className="rounded border border-gray-300 px-2 py-1"
                    >
                      <option value="">—</option>
                      {leagues.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <button type="button" onClick={save} disabled={saving} className="mr-2 text-blue-600 hover:underline disabled:opacity-50">Save</button>
                    <button type="button" onClick={cancel} className="text-gray-600 hover:underline">Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="py-2 pr-4">{t.name}</td>
                  <td className="py-2 pr-4 font-mono text-gray-600">{t.slug}</td>
                  <td className="py-2 pr-4">{t.league_name ?? "—"}</td>
                  <td className="py-2">
                    <button type="button" onClick={() => startEdit(t)} className="text-blue-600 hover:underline">Edit</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {teams.length === 0 && <p className="mt-4 text-gray-500">No teams. Import CSV from Import to create teams.</p>}
    </div>
  );
}
