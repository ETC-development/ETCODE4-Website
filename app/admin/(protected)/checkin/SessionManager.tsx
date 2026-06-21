"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckinSession } from "@/lib/admin/checkin";
import { createSession, deleteSession, setActiveSession } from "./actions";

export default function SessionManager({
  sessions,
  canDelete,
}: {
  sessions: CheckinSession[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"general" | "meal">("general");
  const [error, setError] = useState<string | null>(null);
  // Deleting a session cascades to its check-ins — arm the delete, then confirm.
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Failed.");
      else router.refresh();
    });
  }

  function add() {
    if (label.trim().length < 2) return;
    run(async () => {
      const res = await createSession(label.trim(), kind);
      if (res.ok) setLabel("");
      return res;
    });
  }

  return (
    <div className="rounded-xl border border-bone/10 bg-surface p-4">
      <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        Sessions <span className="text-bone/45">(managers+)</span>
      </h2>

      <ul className="mt-3 space-y-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
              s.is_active
                ? "border-orange/40 bg-orange/10"
                : "border-bone/10 bg-court",
            )}
          >
            <span className="text-sm text-bone/85">
              {s.label}
              <span className="ml-1 text-caption text-bone/55">{s.kind}</span>
            </span>
            <span className="flex items-center gap-2">
              {s.is_active ? (
                <span className="text-caption font-semibold uppercase text-orange">
                  Active
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => setActiveSession(s.id))}
                  className="rounded-md border border-bone/20 px-2.5 py-1 text-caption text-bone/80 hover:text-bone disabled:opacity-50"
                >
                  Set active
                </button>
              )}
              {canDelete && confirmId === s.id ? (
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setConfirmId(null);
                      run(() => deleteSession(s.id));
                    }}
                    className="rounded-md bg-danger px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="rounded-md px-2 py-1 text-caption text-bone/60 hover:text-bone"
                  >
                    Cancel
                  </button>
                </span>
              ) : canDelete ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmId(s.id)}
                  aria-label={`Delete ${s.label}`}
                  className="text-bone/55 hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </span>
          </li>
        ))}
        {sessions.length === 0 ? (
          <li className="rounded-lg border border-dashed border-bone/10 px-3 py-4 text-center text-caption text-bone/55">
            No sessions yet. Create one below.
          </li>
        ) : null}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Day 1: Arrival"
          className="grow rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none placeholder:text-bone/45 focus-visible:border-orange"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "general" | "meal")}
          className="rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange"
        >
          <option value="general">general</option>
          <option value="meal">meal</option>
        </select>
        <button
          type="button"
          disabled={pending || label.trim().length < 2}
          onClick={add}
          className="rounded-lg bg-orange px-4 py-2 text-caption font-semibold uppercase tracking-wide text-court disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
