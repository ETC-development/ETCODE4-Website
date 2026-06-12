"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

export default function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.3,
  });
  const scaleX = reduced ? scrollYProgress : smooth;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[80] h-0.5 origin-left bg-orange"
    />
  );
}
