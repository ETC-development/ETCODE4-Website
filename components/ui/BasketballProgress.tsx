"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface BasketballProgressProps {
  steps: string[];
  current: number;
}

const SPRING = { type: "spring", stiffness: 120, damping: 20, mass: 0.7 } as const;

export default function BasketballProgress({ steps, current }: BasketballProgressProps) {
  const reduced = useReducedMotion();
  const last = Math.max(1, steps.length - 1);
  const pct = (Math.min(current, last) / last) * 100;
  const rolls = current * 540;

  return (
    <div className="w-full">
      <div className="relative h-1.5 rounded-full bg-chalk/15">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-orange/70"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduced ? { duration: 0 } : SPRING}
        />
        <motion.div
          className="absolute top-1/2 z-10"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={reduced ? { duration: 0 } : SPRING}
          style={{ translateX: "-50%", translateY: "-50%" }}
        >
          <motion.div
            animate={reduced ? {} : { rotate: rolls }}
            transition={reduced ? { duration: 0 } : SPRING}
            className="drop-shadow-[0_0_12px_rgba(221,119,45,0.5)]"
          >
            <Ball />
          </motion.div>
        </motion.div>
      </div>

      <ol className="mt-4 flex justify-between">
        {steps.map((label, i) => (
          <li
            key={label}
            className={cn(
              "font-body text-caption uppercase tracking-[0.16em] transition-colors duration-300",
              i <= current ? "text-bone" : "text-chalk/40",
              i === steps.length - 1 ? "text-right" : i === 0 ? "text-left" : "text-center",
            )}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Ball() {
  return (
    <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden className="block">
      <circle cx="50" cy="50" r="46" fill="var(--orange)" />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      <g stroke="rgba(24,29,45,0.55)" strokeWidth="4" fill="none">
        <path d="M50 4 V96" />
        <path d="M4 50 H96" />
        <path d="M14 22 Q50 50 14 78" />
        <path d="M86 22 Q50 50 86 78" />
      </g>
    </svg>
  );
}
