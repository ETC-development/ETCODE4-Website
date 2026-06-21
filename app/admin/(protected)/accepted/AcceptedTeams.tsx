"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamRecord } from "@/lib/admin/types";
import MemberEditor from "../teams/MemberEditor";

function teamLabel(t: TeamRecord): string {
  return t.assigned_name || t.name;
}

export default function AcceptedTeams({ teams }: { teams: TeamRecord[] }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => {
      const hay = [
        t.team_code,
        t.name,
        t.assigned_name ?? "",
        ...t.members.flatMap((m) => [m.full_name, m.email]),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [teams, query]);

  return (
    <div className="space-y-4">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bone/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by team, code, member name or email…"
          className="w-full rounded-lg border border-bone/15 bg-court py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-bone/40 focus-visible:border-orange"
        />
      </label>

      <p className="text-caption text-bone/45">
        {filtered.length} of {teams.length} accepted teams
      </p>

      <ul className="space-y-2">
        {filtered.map((t) => {
          const open = openId === t.id;
          return (
            <li
              key={t.id}
              className="overflow-hidden rounded-xl border border-bone/10 bg-surface"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : t.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bone/5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg uppercase">
                    {teamLabel(t)}
                  </span>
                  <span className="font-body text-caption text-bone/45">
                    {t.assigned_name ? `“${t.name}” · ` : ""}
                    {t.team_code} · {t.members.length}/3 members
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "ml-auto size-5 shrink-0 text-bone/40 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>

              {open ? (
                <ul className="space-y-3 border-t border-bone/10 p-4">
                  {t.members.map((m) => (
                    <MemberEditor key={m.id} member={m} canEdit />
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed border-bone/12 px-4 py-10 text-center text-sm text-bone/50">
            No teams match “{query}”.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
