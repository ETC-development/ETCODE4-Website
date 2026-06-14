"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/admin/format";
import type { AuditEntry } from "@/lib/admin/audit";

const ACTION_LABEL: Record<string, string> = {
  "team.accept": "Accepted team",
  "team.waitlist": "Waitlisted team",
  "team.reject": "Rejected team",
  "team.bulk": "Bulk decision",
  "team.flag": "Flagged team",
  "team.unflag": "Unflagged team",
  "team.note": "Edited internal note",
  "email.acceptance": "Sent acceptance email",
  "email.rejection": "Sent rejection email",
  "email.reminder": "Sent reminder email",
  "email.checkin_qr": "Sent check-in QR email",
  "session.create": "Created session",
  "session.activate": "Activated session",
  "session.delete": "Deleted session",
  "settings.update": "Updated settings",
  "admin.add": "Added admin",
  "admin.role": "Changed admin role",
  "admin.remove": "Removed admin",
  "draft.form_team": "Formed team from solos",
};

const CATEGORIES = ["all", "team", "email", "session", "settings", "admin", "draft"] as const;

function label(action: string) {
  return ACTION_LABEL[action] ?? action.replace(/[._]/g, " ");
}
function metaSummary(meta: Record<string, unknown> | null): string {
  if (!meta) return "";
  if ("from" in meta && "to" in meta) return `${meta.from} → ${meta.to}`;
  if ("to" in meta && "count" in meta) return `${meta.to} ×${meta.count}`;
  const s = JSON.stringify(meta);
  return s.length > 70 ? s.slice(0, 70) + "…" : s;
}

export default function AuditTable({ entries }: { entries: AuditEntry[] }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (cat !== "all" && !e.action.startsWith(cat + ".")) return false;
      if (query) {
        const hay = `${e.action} ${e.target ?? ""} ${e.actor} ${label(e.action)}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [entries, cat, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-caption uppercase tracking-wide transition-colors",
              cat === c
                ? "border-orange/40 bg-orange/10 text-bone"
                : "border-bone/10 bg-surface text-bone/55 hover:text-bone",
            )}
          >
            {c}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actor, target…"
          className="ml-auto rounded-lg border border-bone/15 bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-bone/45 focus-visible:border-orange"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-bone/10">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-surface text-caption uppercase tracking-wide text-bone/55">
            <tr>
              <th scope="col" className="px-3 py-3 font-semibold">When</th>
              <th scope="col" className="px-3 py-3 font-semibold">Who</th>
              <th scope="col" className="px-3 py-3 font-semibold">Action</th>
              <th scope="col" className="px-3 py-3 font-semibold">Target</th>
              <th scope="col" className="px-3 py-3 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-bone/8">
                <td className="whitespace-nowrap px-3 py-2.5 text-bone/55">
                  {fmtDateTime(e.created_at)}
                </td>
                <td className="px-3 py-2.5 text-bone/80">{e.actor}</td>
                <td className="px-3 py-2.5 text-bone">{label(e.action)}</td>
                <td className="px-3 py-2.5 font-mono text-caption text-bone/60">
                  {e.target ?? "n/a"}
                </td>
                <td className="px-3 py-2.5 text-caption text-bone/55">
                  {metaSummary(e.meta)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-bone/55">
                  No matching activity.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
