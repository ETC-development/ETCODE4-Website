"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/admin/Toast";
import type { Settings } from "@/lib/admin/settings";
import { updateSettings } from "./actions";

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(initial.registration_open);
  const [maxTeams, setMaxTeams] = useState(
    initial.max_teams === null ? "" : String(initial.max_teams),
  );
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateSettings(open, maxTeams);
      if (!res.ok) return setError(res.error);
      toast.success("Settings saved.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-bone/10 bg-surface p-5">
      <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        Event settings
      </h2>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-bone">Registration</p>
          <p className="text-caption text-bone/45">
            {open ? "Open. New teams can register." : "Closed. Sign-ups blocked."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "relative h-7 w-12 rounded-full transition-colors",
            open ? "bg-orange" : "bg-bone/20",
          )}
        >
          <span
            className={cn(
              "absolute top-1 size-5 rounded-full bg-bone transition-transform",
              open ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>

      <label className="mt-5 block">
        <span className="text-caption text-bone/45">
          Capacity (max accepted teams). Drives the dashboard fill %
        </span>
        <input
          value={maxTeams}
          onChange={(e) => setMaxTeams(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          placeholder="e.g. 40"
          className="mt-1 w-32 rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange"
        />
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-orange px-4 py-2 text-caption font-semibold uppercase tracking-wide text-court disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
        {error ? (
          <span role="alert" className="text-caption text-danger">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
