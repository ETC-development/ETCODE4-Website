"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/admin/Toast";
import { EmptyState } from "@/components/admin/ui";
import { fmtDate } from "@/lib/admin/format";
import type { SoloRow } from "@/lib/admin/draft";
import { formTeamFromSolos } from "./actions";

export default function DraftBoard({ solos }: { solos: SoloRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, id];
    });
  }

  function form() {
    if (selected.length !== 3 || name.trim().length < 2) return;
    setError(null);
    startTransition(async () => {
      const res = await formTeamFromSolos(selected, name.trim());
      if (!res.ok) return setError(res.error);
      toast.success(`Formed ${res.code}. Now in the review queue.`);
      setSelected([]);
      setName("");
      router.refresh();
    });
  }

  const order = (id: string) => selected.indexOf(id);

  return (
    <section className={cn(selected.length > 0 && "pb-24")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-4xl uppercase">Draft board</h1>
        <p className="text-caption text-bone/60">{solos.length} free agents</p>
      </div>
      <p className="mt-1 text-sm text-bone/55">
        Pick 3 solos to form a team. First pick becomes the leader. The new team
        enters review like any other.
      </p>

      {solos.length === 0 ? (
        <EmptyState className="mt-6">No solo free-agents right now.</EmptyState>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {solos.map((s) => {
            const idx = order(s.id);
            const isSel = idx >= 0;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    isSel
                      ? "border-orange bg-orange/10"
                      : "border-bone/10 bg-surface hover:border-bone/25",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-bone">{s.full_name}</span>
                    {isSel ? (
                      <span className="grid size-6 place-items-center rounded-full bg-orange text-caption font-bold text-court">
                        {idx === 0 ? "L" : idx + 1}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-caption text-bone/50">
                    {s.institution ?? "n/a"} · {s.study_year ?? "n/a"}
                  </p>
                  {s.motivation ? (
                    <p className="mt-2 line-clamp-2 text-caption italic text-bone/45">
                      {s.motivation}
                    </p>
                  ) : null}
                  <p className="mt-2 text-caption text-bone/45">
                    joined {fmtDate(s.created_at)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* form bar */}
      {selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bone/15 bg-surface-2/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
            <span className="text-sm text-bone/80">{selected.length}/3 picked</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name"
              aria-label="New team name"
              className="grow rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none placeholder:text-bone/45 focus-visible:border-orange sm:max-w-xs"
            />
            {error ? (
              <span role="alert" className="text-caption text-danger">{error}</span>
            ) : null}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-sm text-bone/50 hover:text-bone"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={pending || selected.length !== 3 || name.trim().length < 2}
              onClick={form}
              className="ml-auto rounded-lg bg-orange px-5 py-2 text-caption font-semibold uppercase tracking-wide text-court disabled:opacity-40"
            >
              {pending ? "Forming…" : "Form team"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
