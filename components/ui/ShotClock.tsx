"use client";

import { useEffect, useState } from "react";
import { countdownTo, pad2 } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ShotClockProps {
  targetISO: string;
  className?: string;
  label?: string;
}

const UNITS = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hrs" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
] as const;

export default function ShotClock({ targetISO, className, label }: ShotClockProps) {
  const [t, setT] = useState<ReturnType<typeof countdownTo> | null>(null);

  useEffect(() => {
    const tick = () => setT(countdownTo(targetISO, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetISO]);

  const value = (key: (typeof UNITS)[number]["key"]) =>
    t ? pad2(t[key]) : "--";

  return (
    <div className={cn("inline-flex flex-col gap-2", className)} role="timer" aria-live="off">
      {label && (
        <span className="font-body text-caption uppercase tracking-[0.3em] text-chalk/55">
          {label}
        </span>
      )}
      <div className="flex items-end gap-3 sm:gap-4" aria-hidden={!t}>
        {UNITS.map((u, i) => (
          <div key={u.key} className="flex items-end gap-3 sm:gap-4">
            <div className="flex flex-col items-center">
              <span className="font-display text-[clamp(2.4rem,1.6rem+3vw,4rem)] leading-none tracking-tight tabular-nums text-bone">
                {value(u.key)}
              </span>
              <span className="mt-1.5 font-body text-[0.6rem] uppercase tracking-[0.32em] text-chalk/50">
                {u.label}
              </span>
            </div>
            {i < UNITS.length - 1 && (
              <span className="pb-6 font-display text-[clamp(1.8rem,1.2rem+2vw,3rem)] leading-none text-orange/70">
                :
              </span>
            )}
          </div>
        ))}
      </div>
      {t?.done && (
        <span className="font-body text-caption uppercase tracking-[0.2em] text-orange">
          The buzzer sounded. It&apos;s game time.
        </span>
      )}
    </div>
  );
}
