"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { AdminRole } from "@/lib/auth";
import type { AdminRow } from "@/lib/admin/settings";
import { addAdmin, removeAdmin, setAdminRole } from "./actions";

const ROLES: AdminRole[] = ["super_admin", "manager", "hr_checkin"];

export default function AdminManager({
  admins,
  selfId,
}: {
  admins: AdminRow[];
  selfId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Destructive actions (remove, role change) are armed first, then confirmed —
  // a single mis-click can't delete a colleague's account or demote them.
  const [confirm, setConfirm] = useState<
    | { kind: "remove"; id: string; email: string }
    | { kind: "role"; id: string; email: string; role: AdminRole }
    | null
  >(null);

  // add form
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("manager");
  const [password, setPassword] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "Failed.");
      after?.();
      router.refresh();
    });
  }

  function confirmAction() {
    if (!confirm) return;
    const c = confirm;
    setConfirm(null);
    if (c.kind === "remove") run(() => removeAdmin(c.id));
    else run(() => setAdminRole(c.id, c.role));
  }

  return (
    <div className="rounded-xl border border-bone/10 bg-surface p-5">
      <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        Admins
      </h2>

      <ul className="mt-3 divide-y divide-bone/10">
        {admins.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 py-2.5">
            <div className="min-w-0 grow">
              <p className="truncate text-sm text-bone">
                {a.full_name || a.email}
                {a.id === selfId ? (
                  <span className="ml-1 text-caption text-orange">you</span>
                ) : null}
              </p>
              <p className="truncate text-caption text-bone/55">{a.email}</p>
            </div>
            <select
              value={a.role}
              disabled={pending || a.id === selfId}
              onChange={(e) =>
                setConfirm({
                  kind: "role",
                  id: a.id,
                  email: a.email,
                  role: e.target.value as AdminRole,
                })
              }
              className="rounded-lg border border-bone/15 bg-court px-2 py-1.5 text-caption outline-none focus-visible:border-orange disabled:opacity-50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || a.id === selfId}
              onClick={() => setConfirm({ kind: "remove", id: a.id, email: a.email })}
              aria-label={`Remove ${a.email}`}
              className="text-bone/55 hover:text-danger disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      {confirm ? (
        <div
          role="alertdialog"
          aria-label="Confirm action"
          className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5"
        >
          <p className="grow text-caption text-bone">
            {confirm.kind === "remove" ? (
              <>
                Remove <strong>{confirm.email}</strong>? This deletes their admin
                account.
              </>
            ) : (
              <>
                Change <strong>{confirm.email}</strong> to{" "}
                <strong>{confirm.role}</strong>?
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            className="rounded-lg px-3 py-1.5 text-caption text-bone/60 hover:text-bone"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirmAction}
            className="rounded-lg bg-danger px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {confirm.kind === "remove" ? "Remove" : "Change role"}
          </button>
        </div>
      ) : null}

      {/* add admin */}
      <div className="mt-4 rounded-lg border border-bone/10 bg-court p-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-bone/50">
          Add admin
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="email"
            className="rounded-lg border border-bone/15 bg-surface px-3 py-2 text-sm outline-none focus-visible:border-orange"
          />
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="full name (optional)"
            className="rounded-lg border border-bone/15 bg-surface px-3 py-2 text-sm outline-none focus-visible:border-orange"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="rounded-lg border border-bone/15 bg-surface px-3 py-2 text-sm outline-none focus-visible:border-orange"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="temp password (≥ 8 chars)"
            className="rounded-lg border border-bone/15 bg-surface px-3 py-2 text-sm outline-none focus-visible:border-orange"
          />
        </div>
        <button
          type="button"
          disabled={pending || !email || password.length < 8}
          onClick={() =>
            run(
              () => addAdmin(email, fullName, role, password),
              () => {
                setEmail("");
                setFullName("");
                setPassword("");
                setRole("manager");
              },
            )
          }
          className="mt-2 rounded-lg bg-orange px-4 py-2 text-caption font-semibold uppercase tracking-wide text-court disabled:opacity-40"
        >
          Create account
        </button>
        <p className="mt-1.5 text-caption text-bone/50">
          The account is active immediately. Share the temp password; they can change
          it later.
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
