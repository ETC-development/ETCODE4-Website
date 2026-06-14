"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BoardSnapshot, BoardTick } from "@/lib/admin/board";
import { getBoardTickAction } from "./actions";

// Full-bleed projector frame. Fixed overlay so it covers the ops chrome on its
// own — independent of the layout, so it works on client-side navigation too.
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-court px-[4vw] py-[4vh] text-bone">
      <Link
        href="/admin/checkin"
        className="absolute right-[3vw] top-[3vh] z-10 rounded-md border border-bone/15 px-3 py-1.5 text-caption text-bone/55 transition-colors hover:text-bone"
      >
        Exit
      </Link>
      {children}
    </div>
  );
}

function sig(t: Pick<BoardTick, "counts" | "completedCodes">): string {
  return `${t.counts.participantsChecked}-${t.counts.teamsComplete}-${t.completedCodes.join(",")}`;
}

function Ring({ pct }: { pct: number }) {
  const r = 86;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, pct / 100)));
  return (
    <svg viewBox="0 0 200 200" className="size-44">
      <circle cx="100" cy="100" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
      <circle
        cx="100"
        cy="100"
        r={r}
        fill="none"
        stroke="var(--orange)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 0.6s var(--expo-out)" }}
      />
      <text
        x="100"
        y="104"
        textAnchor="middle"
        className="fill-bone font-display"
        style={{ fontSize: "44px" }}
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function BoardClient({ initial }: { initial: BoardSnapshot }) {
  const teams = initial.teams; // static list; tick only updates which are complete
  const [live, setLive] = useState<BoardTick>({
    session: initial.session,
    counts: initial.counts,
    completedCodes: initial.completedCodes,
  });
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [pulse, setPulse] = useState(false);
  const prevSig = useRef(sig(initial));

  // polling: visibility-aware, non-overlapping (chained setTimeout + guard)
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;

    const apply = (t: BoardTick) => {
      const s = sig(t);
      setLive(t);
      setSecondsAgo(0);
      if (s !== prevSig.current) {
        prevSig.current = s;
        setPulse(true);
        setTimeout(() => alive && setPulse(false), 900);
      }
    };

    const doTick = async () => {
      if (running || !alive || document.hidden) return;
      running = true;
      try {
        const t = await getBoardTickAction();
        if (alive && t) apply(t);
      } catch {
        // network blip — next scheduled tick retries
      } finally {
        running = false;
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        await doTick();
        if (alive && !document.hidden) schedule();
      }, 3000);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer); // locked desk laptop stops polling
      } else {
        doTick(); // refresh immediately on return, then resume
        schedule();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // "updated Ns ago" ticker
  useEffect(() => {
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { session, counts } = live;
  const completed = new Set(live.completedCodes);
  const pct = counts.participantsTotal
    ? Math.round((counts.participantsChecked / counts.participantsTotal) * 100)
    : 0;

  const freshness = (
    <span className="inline-flex items-center gap-2 text-caption uppercase tracking-[0.18em] text-bone/45">
      <span
        className={cn("size-2 rounded-full bg-orange", pulse && "animate-pulse")}
      />
      live · updated {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
    </span>
  );

  if (!session) {
    return (
      <Frame>
        <div className="grid min-h-[80vh] place-items-center text-center">
          <div>
            <p className="font-display text-6xl uppercase text-bone/55">
              No active session
            </p>
            <p className="mt-2 text-lg text-bone/50">
              A super-admin can start one from Check-in.
            </p>
            <div className="mt-6">{freshness}</div>
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex items-center justify-between">
        <p className="font-body text-caption uppercase tracking-[0.2em] text-orange">
          {session.label}
        </p>
        {freshness}
      </div>

      <div className="mt-4 flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
        <div className="flex gap-10 text-center lg:gap-16 lg:text-left">
          <div>
            <p className="font-display text-7xl leading-none text-bone tabular-nums xl:text-8xl 2xl:text-9xl">
              {counts.participantsChecked}
              <span className="text-bone/30">/{counts.participantsTotal}</span>
            </p>
            <p className="mt-1 text-sm uppercase tracking-wide text-bone/50 xl:text-base">
              Participants in
            </p>
          </div>
          <div>
            <p className="font-display text-7xl leading-none text-orange tabular-nums xl:text-8xl 2xl:text-9xl">
              {counts.teamsComplete}
              <span className="text-bone/30">/{counts.teamsTotal}</span>
            </p>
            <p className="mt-1 text-sm uppercase tracking-wide text-bone/50 xl:text-base">
              Teams complete
            </p>
          </div>
        </div>
        <Ring pct={pct} />
      </div>

      {/* team grid — lights orange as teams complete */}
      <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {teams.map((t) => {
          const done = completed.has(t.code);
          return (
            <div
              key={t.code}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition-colors duration-500",
                done
                  ? "border-orange bg-orange text-court"
                  : "border-bone/10 bg-surface text-bone",
              )}
            >
              <p className="font-display text-lg uppercase leading-tight xl:text-2xl">
                {t.name}
              </p>
              <p
                className={cn(
                  "font-body text-sm",
                  done ? "text-court/70" : "text-bone/50",
                )}
              >
                {t.code}
                {done ? " · ✓" : ""}
              </p>
            </div>
          );
        })}
        {teams.length === 0 ? (
          <p className="col-span-full py-10 text-center text-bone/50">
            No accepted teams yet.
          </p>
        ) : null}
      </div>
    </Frame>
  );
}
