"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendParticipantFeedback, sendContributorFeedback } from "./actions";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SendItem = { id: string; name: string };

export default function FeedbackBulkSend({
  items,
  kind,
  title,
}: {
  items: SendItem[];
  kind: "participant" | "contributor";
  title: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [tally, setTally] = useState({ sent: 0, skipped: 0, failed: 0 });
  const [failures, setFailures] = useState<string[]>([]);

  const total = items.length;
  const send = kind === "participant" ? sendParticipantFeedback : sendContributorFeedback;

  async function run() {
    if (running || total === 0) return;
    setRunning(true);
    setDone(0);
    setTally({ sent: 0, skipped: 0, failed: 0 });
    setFailures([]);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const res = await send(it.id, false);
      setDone(i + 1);
      if (!res.ok) {
        setTally((x) => ({ ...x, failed: x.failed + 1 }));
        setFailures((f) => [...f, `${it.name}: ${res.error}`]);
      } else if (res.status === "skipped") {
        setTally((x) => ({ ...x, skipped: x.skipped + 1 }));
      } else {
        setTally((x) => ({ ...x, sent: x.sent + 1 }));
      }
      if (i < items.length - 1) await sleep(1100); // ~1/sec
    }

    setRunning(false);
    router.refresh();
  }

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-bone/10 bg-surface p-5">
      <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/55">
        {title}
      </h2>
      <p className="mt-1 text-sm text-bone/70">
        {total === 0
          ? "Everyone eligible has been invited."
          : `${total} ${kind}${total === 1 ? "" : "s"} not yet invited.`}
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running || total === 0}
        className="mt-3 rounded-lg bg-orange px-4 py-2 text-caption font-semibold uppercase tracking-wide text-court transition-opacity disabled:opacity-40"
      >
        {running ? `Sending ${done}/${total}…` : `Invite ${total} ${kind}${total === 1 ? "" : "s"}`}
      </button>

      {(running || done > 0) && total > 0 ? (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-court">
            <div className="h-full bg-orange transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-caption text-bone/60">
            {tally.sent} sent · {tally.skipped} skipped · {tally.failed} failed
          </p>
          {failures.length ? (
            <ul className="mt-2 space-y-1 text-caption text-danger">
              {failures.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
