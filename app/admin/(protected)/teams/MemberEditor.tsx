"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { safeExternalUrl } from "@/lib/utils";
import type { RosterMember } from "@/lib/admin/types";
import type { MemberEditFields } from "@/lib/admin/member-edit";
import { updateMember } from "./actions";

const HANDLES: { key: keyof RosterMember; label: string }[] = [
  { key: "leetcode", label: "LeetCode" },
  { key: "hackerrank", label: "HackerRank" },
  { key: "github", label: "GitHub" },
];

// Optional text fields rendered as a labelled grid in edit mode.
const OPTIONAL_FIELDS: { key: keyof MemberEditFields; label: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "institution", label: "Institution" },
  { key: "study_year", label: "Year" },
  { key: "tshirt_size", label: "T-shirt" },
  { key: "leetcode", label: "LeetCode" },
  { key: "hackerrank", label: "HackerRank" },
  { key: "github", label: "GitHub" },
];

function initialForm(m: RosterMember): MemberEditFields {
  return {
    full_name: m.full_name,
    email: m.email,
    phone: m.phone ?? "",
    institution: m.institution ?? "",
    study_year: m.study_year ?? "",
    leetcode: m.leetcode ?? "",
    hackerrank: m.hackerrank ?? "",
    github: m.github ?? "",
    motivation: m.motivation ?? "",
    tshirt_size: m.tshirt_size ?? "",
  };
}

export default function MemberEditor({
  member,
  canEdit,
}: {
  member: RosterMember;
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<MemberEditFields>(() => initialForm(member));
  const [error, setError] = useState<string | null>(null);

  function open() {
    setForm(initialForm(member));
    setError(null);
    setEditing(true);
  }

  function set(key: keyof MemberEditFields, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateMember(member.id, form);
      if (!res.ok) return setError(res.error);
      setEditing(false);
      router.refresh();
      toast.success("Member updated");
    });
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-orange/30 bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-caption uppercase tracking-wide text-bone/55">
            {member.role}
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-caption text-bone/45">Full name</span>
            <input
              value={form.full_name ?? ""}
              onChange={(e) => set("full_name", e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange"
            />
          </label>
          <label className="block">
            <span className="text-caption text-bone/45">Email</span>
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange"
            />
          </label>
          {OPTIONAL_FIELDS.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="text-caption text-bone/45">{label}</span>
              <input
                value={(form[key] as string | undefined) ?? ""}
                onChange={(e) => set(key, e.target.value)}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange"
              />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <span className="text-caption text-bone/45">Motivation</span>
            <textarea
              value={form.motivation ?? ""}
              onChange={(e) => set("motivation", e.target.value)}
              rows={2}
              maxLength={2000}
              className="mt-1 w-full resize-y rounded-lg border border-bone/15 bg-court px-3 py-2 text-sm outline-none focus-visible:border-orange"
            />
          </label>
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-lg bg-orange px-4 py-2 text-caption font-semibold uppercase tracking-wide text-court transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="rounded-lg border border-bone/20 px-4 py-2 text-caption font-semibold uppercase tracking-wide text-bone/80 transition-colors hover:bg-bone/5 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-bone/10 bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-bone">{member.full_name}</span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-caption uppercase tracking-wide text-bone/55">
          {member.role}
        </span>
        {canEdit ? (
          <button
            type="button"
            onClick={open}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-bone/15 px-2 py-1 text-caption text-bone/50 transition-colors hover:text-bone"
          >
            <Pencil className="size-3" /> Edit
          </button>
        ) : null}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-bone/70">
        <div className="col-span-2 sm:col-span-1">
          <dt className="inline text-bone/55">Email: </dt>
          <dd className="inline">{member.email}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="inline text-bone/55">Phone: </dt>
          <dd className="inline">{member.phone ?? "n/a"}</dd>
        </div>
        <div>
          <dt className="inline text-bone/55">Institution: </dt>
          <dd className="inline">{member.institution ?? "n/a"}</dd>
        </div>
        <div>
          <dt className="inline text-bone/55">Year: </dt>
          <dd className="inline">{member.study_year ?? "n/a"}</dd>
        </div>
        {member.tshirt_size ? (
          <div>
            <dt className="inline text-bone/55">T-shirt: </dt>
            <dd className="inline">{member.tshirt_size}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-2 flex flex-wrap gap-3 text-caption">
        {HANDLES.map(({ key, label }) => {
          const url = safeExternalUrl(member[key] as string | null);
          return url ? (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-skyblue hover:text-orange"
            >
              {label} ↗
            </a>
          ) : null;
        })}
      </div>

      {member.motivation ? (
        <p className="mt-2 border-l-2 border-bone/15 pl-3 text-sm italic text-bone/60">
          {member.motivation}
        </p>
      ) : null}
    </li>
  );
}
