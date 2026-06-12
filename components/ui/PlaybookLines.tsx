"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface Stroke {
  d: string;
  delay?: number;
  duration?: number;
  arrow?: boolean;
  dashed?: boolean;
}

interface PlaybookLinesProps {
  viewBox: string;
  strokes: Stroke[];
  className?: string;
  color?: string;
  width?: number;
  trigger?: "mount" | "view";
  idSeed?: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function PlaybookLines({
  viewBox,
  strokes,
  className,
  color = "var(--chalk)",
  width = 2,
  trigger = "mount",
  idSeed = "pb",
}: PlaybookLinesProps) {
  const reduced = useReducedMotion();
  const markerId = `${idSeed}-arrow`;

  const animateProps = (s: Stroke) =>
    reduced
      ? { initial: { pathLength: 1 }, animate: { pathLength: 1 } }
      : trigger === "mount"
        ? {
            initial: { pathLength: 0 },
            animate: { pathLength: 1 },
            transition: { duration: s.duration ?? 1.1, ease: EASE, delay: s.delay ?? 0 },
          }
        : {
            initial: { pathLength: 0 },
            whileInView: { pathLength: 1 },
            viewport: { once: true, margin: "-10%" },
            transition: { duration: s.duration ?? 1.1, ease: EASE, delay: s.delay ?? 0 },
          };

  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="none"
      className={cn("pointer-events-none", className)}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={color} />
        </marker>
      </defs>
      {strokes.map((s, i) => (
        <motion.path
          key={i}
          d={s.d}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={s.dashed ? "1 10" : undefined}
          markerEnd={s.arrow ? `url(#${markerId})` : undefined}
          {...animateProps(s)}
        />
      ))}
    </svg>
  );
}
