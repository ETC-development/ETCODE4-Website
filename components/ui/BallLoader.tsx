"use client";

import { motion, useReducedMotion } from "motion/react";

export default function BallLoader({ size = 40 }: { size?: number }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <span role="status" aria-label="Loading">
        <Ball size={size} />
      </span>
    );
  }

  return (
    <span role="status" aria-label="Loading" className="inline-flex flex-col items-center">
      <motion.span
        animate={{ y: [0, -size * 0.7, 0], scaleY: [1, 1.03, 0.92, 1] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: [0.45, 0, 0.55, 1], times: [0, 0.5, 0.85, 1] }}
        style={{ transformOrigin: "bottom center" }}
      >
        <motion.span
          className="block"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        >
          <Ball size={size} />
        </motion.span>
      </motion.span>
      <motion.span
        className="mt-1 block rounded-[50%] bg-court"
        style={{ width: size * 0.8, height: size * 0.14 }}
        animate={{ scaleX: [1, 0.7, 1], opacity: [0.5, 0.25, 0.5] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      />
    </span>
  );
}

function Ball({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="block">
      <circle cx="50" cy="50" r="46" fill="var(--orange)" />
      <g stroke="rgba(24,29,45,0.55)" strokeWidth="4" fill="none">
        <path d="M50 4 V96" />
        <path d="M4 50 H96" />
        <path d="M14 22 Q50 50 14 78" />
        <path d="M86 22 Q50 50 86 78" />
      </g>
    </svg>
  );
}
