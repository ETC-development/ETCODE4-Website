"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importContributors } from "./actions";

const PLACEHOLDER = `Lina Haddad, lina@example.com, organizer
Yacine Brahimi, yacine@example.com, mentor
Sara Belkacem, sara@example.com, organizer`;

export default function ContributorImport() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; errors?: string[] } | null>(null);

  async function run() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await importContributors(text);
    setBusy(false);
    if (res.ok) {
      setMsg({
        ok: true,
        text: `Imported ${res.added} new · ${res.skipped} already on file.`,
        errors: res.errors,
      });
      if (res.added > 0) {
        setText("");
        router.refresh();
      }
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="rounded-xl border border-bone/10 bg-surface p-5">
      <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        Import contributors
      </h2>
      <p className="mt-1 text-caption text-bone/55">
        One per line: <code className="text-bone/75">Name, email, role</code>. Role is{" "}
        <code className="text-bone/75">organizer</code> or <code className="text-bone/75">mentor</code>.
        Duplicate emails are skipped.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={5}
        spellCheck={false}
        className="mt-3 w-full resize-y rounded-lg border border-bone/15 bg-court px-3 py-2 font-mono text-sm text-bone outline-none placeholder:text-bone/25 focus-visible:border-orange"
      />

      <button
        type="button"
        onClick={run}
        disabled={busy || !text.trim()}
        className="mt-3 rounded-lg border border-bone/20 px-4 py-2 text-caption font-semibold uppercase tracking-wide text-bone/85 transition-colors hover:border-orange/40 hover:text-bone disabled:opacity-40"
      >
        {busy ? "Importing…" : "Import"}
      </button>

      {msg ? (
        <div className="mt-3 text-sm">
          <p className={msg.ok ? "text-orange" : "text-danger"}>{msg.text}</p>
          {msg.errors && msg.errors.length ? (
            <ul className="mt-1 space-y-0.5 text-caption text-bone/50">
              {msg.errors.slice(0, 8).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
