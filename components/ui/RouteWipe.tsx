"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const EXPO_IO = [0.87, 0, 0.13, 1] as const;

export default function RouteWipe() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  if (reduced || done) return null;

  return (
    <motion.div
      aria-hidden
      initial={{ x: "0%" }}
      animate={{ x: "101%" }}
      transition={{ duration: 0.62, ease: EXPO_IO }}
      onAnimationComplete={() => setDone(true)}
      className="pointer-events-none fixed inset-0 z-[95] bg-court"
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "url('/tex/scratch.webp')",
          backgroundSize: "cover",
          mixBlendMode: "overlay",
        }}
      />
      <div className="absolute inset-y-0 left-0 w-[3px] bg-orange shadow-[0_0_30px_6px_rgba(221,119,45,0.45)]" />
    </motion.div>
  );
}
