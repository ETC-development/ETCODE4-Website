"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { Camera, CameraOff, Check, Search, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CheckinState,
  RosterSearchTeam,
  ScanResult,
} from "@/lib/admin/checkin";
import {
  checkInByToken,
  checkInParticipant,
  refreshState,
  searchRosterAction,
} from "./actions";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false },
);

const ERROR_TEXT: Record<string, string> = {
  no_active_session: "No active session. Ask a super-admin to start one.",
  unknown_qr: "Unrecognised QR code.",
  revoked: "This QR has been revoked.",
  not_found: "Participant not found.",
  not_accepted: "Not on an accepted team, can't check in.",
  failed: "Check-in failed.",
};

// SSR-safe online status without setState-in-effect.
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

type FeedEntry = {
  id: number;
  ok: boolean;
  text: string;
  sub?: string;
  complete?: boolean;
  already?: boolean;
};

export default function CheckinClient({
  initial,
}: {
  initial: CheckinState;
}) {
  const [state, setState] = useState<CheckinState>(initial);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [scanning, setScanning] = useState(true);
  const [camError, setCamError] = useState<string | null>(null);
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [banner, setBanner] = useState<string | null>(null);

  const feedId = useRef(0);
  const lastScan = useRef<{ token: string; at: number }>({ token: "", at: 0 });
  const queue = useRef<string[]>([]); // in-memory offline retry queue (no storage)

  const hasSession = Boolean(state.session);

  const pushFeed = useCallback((e: Omit<FeedEntry, "id">) => {
    feedId.current += 1;
    setFeed((prev) => [{ id: feedId.current, ...e }, ...prev].slice(0, 14));
  }, []);

  const flashBanner = useCallback((msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 1800);
  }, []);

  const applyResult = useCallback(
    (res: ScanResult) => {
      if (!res.ok) {
        pushFeed({ ok: false, text: ERROR_TEXT[res.error] ?? "Failed." });
        return;
      }
      const { member, progress, teamComplete, already } = res;
      const prog = progress ? ` (${progress.checked}/${progress.total})` : "";
      pushFeed({
        ok: true,
        already,
        complete: teamComplete,
        text: member.name + (already ? " (already in)" : ""),
        sub: member.teamName
          ? `${member.teamName}${member.teamCode ? ` · ${member.teamCode}` : ""}${prog}`
          : prog || undefined,
      });
      if (teamComplete) flashBanner(`Team complete ✅ ${member.teamName ?? ""}`);
      // refresh counters in the background
      refreshState().then((s) => s && setState(s));
    },
    [pushFeed, flashBanner],
  );

  const submitToken = useCallback(
    async (token: string) => {
      try {
        const res = await checkInByToken(token);
        applyResult(res);
      } catch {
        // network/offline — queue for retry
        queue.current.push(token);
        pushFeed({ ok: false, text: "Offline. Queued, will retry." });
      }
    },
    [applyResult, pushFeed],
  );

  // QR scan handler with debounce on identical token
  const onScan = useCallback(
    (codes: { rawValue: string }[]) => {
      const raw = codes[0]?.rawValue?.trim();
      if (!raw) return;
      const now = Date.now();
      if (lastScan.current.token === raw && now - lastScan.current.at < 2500)
        return;
      lastScan.current = { token: raw, at: now };
      submitToken(raw);
    },
    [submitToken],
  );

  // flush the offline queue when connectivity returns
  useEffect(() => {
    if (!online || queue.current.length === 0) return;
    const pending = queue.current.splice(0, queue.current.length);
    (async () => {
      for (const token of pending) await submitToken(token);
    })();
  }, [online, submitToken]);

  const pct = state.counts.participantsTotal
    ? Math.round(
        (state.counts.participantsChecked / state.counts.participantsTotal) * 100,
      )
    : 0;

  return (
    <div className="mx-auto max-w-md">
      {/* counters */}
      <div className="rounded-xl border border-bone/10 bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-caption uppercase tracking-wide text-bone/45">
              {hasSession ? "Active session" : "No active session"}
            </p>
            <p className="font-display text-2xl uppercase">
              {state.session?.label ?? "n/a"}
            </p>
          </div>
          {!online ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-caption text-danger">
              <WifiOff className="size-3.5" /> Offline
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-court p-3">
            <p className="font-display text-3xl text-orange">
              {state.counts.participantsChecked}
              <span className="text-bone/55">/{state.counts.participantsTotal}</span>
            </p>
            <p className="text-caption uppercase tracking-wide text-bone/45">
              Participants
            </p>
          </div>
          <div className="rounded-lg bg-court p-3">
            <p className="font-display text-3xl text-bone">
              {state.counts.teamsComplete}
              <span className="text-bone/55">/{state.counts.teamsTotal}</span>
            </p>
            <p className="text-caption uppercase tracking-wide text-bone/45">
              Teams complete
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-court">
          <div className="h-full bg-orange transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* team-complete banner */}
      {banner ? (
        <div
          role="status"
          className="mt-3 animate-pulse rounded-xl bg-orange px-4 py-3 text-center font-display text-xl uppercase text-court"
        >
          {banner}
        </div>
      ) : null}

      {/* scanner */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
            Scan QR
          </h2>
          <button
            type="button"
            onClick={() => setScanning((s) => !s)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-bone/15 px-3 py-2 text-caption text-bone/70 hover:text-bone"
          >
            {scanning ? <CameraOff className="size-3.5" /> : <Camera className="size-3.5" />}
            {scanning ? "Pause" : "Resume"}
          </button>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-bone/10 bg-black">
          {hasSession ? (
            <Scanner
              onScan={onScan}
              onError={(err: unknown) =>
                setCamError(
                  err instanceof Error ? err.message : "Camera unavailable.",
                )
              }
              formats={["qr_code"]}
              scanDelay={400}
              allowMultiple
              sound
              paused={!scanning}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%" } }}
            />
          ) : (
            <p className="p-8 text-center text-sm text-bone/50">
              {ERROR_TEXT.no_active_session}
            </p>
          )}
        </div>
        {camError ? (
          <p className="mt-2 text-caption text-danger">{camError}</p>
        ) : null}
      </div>

      {/* manual fallback */}
      <ManualSearch onChecked={applyResult} disabled={!hasSession} />

      {/* feed */}
      {feed.length > 0 ? (
        <div className="mt-5">
          <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
            Recent
          </h2>
          <ul aria-live="polite" className="mt-2 space-y-1.5">
            {feed.map((e) => (
              <li
                key={e.id}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  e.ok
                    ? e.complete
                      ? "border-orange/40 bg-orange/10"
                      : "border-bone/10 bg-surface"
                    : "border-danger/25 bg-danger/5",
                )}
              >
                <span
                  className={cn(
                    "font-medium",
                    e.ok ? "text-bone" : "text-danger",
                  )}
                >
                  {e.ok ? (e.already ? "↺ " : "✓ ") : "✕ "}
                  {e.text}
                </span>
                {e.sub ? (
                  <span className="ml-1 text-bone/55">{e.sub}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

// --- manual search fallback -------------------------------------------------

function ManualSearch({
  onChecked,
  disabled,
}: {
  onChecked: (res: ScanResult) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RosterSearchTeam[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) return; // render derives [] below — no setState here
    timer.current = setTimeout(async () => {
      setResults(await searchRosterAction(query));
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  // only show results for the current (long-enough) query
  const shown = query.trim().length < 2 ? [] : results;

  async function check(id: string) {
    setBusy(id);
    const res = await checkInParticipant(id);
    setBusy(null);
    onChecked(res);
    if (res.ok) setResults(await searchRosterAction(query)); // refresh checked state
  }

  return (
    <div className="mt-5">
      <h2 className="font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/50">
        Find by team (lost QR)
      </h2>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bone/55" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Team code or name…"
          className="w-full rounded-lg border border-bone/15 bg-surface py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-bone/35 focus-visible:border-orange disabled:opacity-50"
        />
      </div>

      {shown.map((t) => (
        <div
          key={t.code}
          className="mt-2 rounded-lg border border-bone/10 bg-surface p-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-bone">{t.name}</span>
            <span className="text-caption text-bone/55">{t.code}</span>
          </div>
          <ul className="mt-2 space-y-1">
            {t.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-bone/80">
                  {m.name}{" "}
                  <span className="text-caption text-bone/55">({m.role})</span>
                </span>
                {m.checked ? (
                  <span className="inline-flex items-center gap-1 text-caption text-orange">
                    <Check className="size-3.5" /> in
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => check(m.id)}
                    disabled={busy === m.id}
                    className="inline-flex min-h-11 items-center rounded-md bg-orange px-4 py-2.5 text-caption font-semibold uppercase tracking-wide text-court disabled:opacity-50"
                  >
                    {busy === m.id ? "…" : "Check in"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
