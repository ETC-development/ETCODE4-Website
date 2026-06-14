"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Per-navigation wrapper (templates remount on every route change, layouts
 * don't) — gives each admin page a quick, smooth fade-in. Honors reduced-motion.
 *
 * Opacity-only on purpose: a transform here would create a containing block and
 * break the board's full-bleed `position: fixed` overlay.
 */
export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
