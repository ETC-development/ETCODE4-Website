"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 34, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 350, damping: 34, mass: 0.6 });
  const dotX = useSpring(x, { stiffness: 1100, damping: 50, mass: 0.35 });
  const dotY = useSpring(y, { stiffness: 1100, damping: 50, mass: 0.35 });

  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = e.target as HTMLElement | null;
      setActive(
        !!el?.closest(
          "a, button, [role='button'], input, select, textarea, [data-cursor='target']",
        ),
      );
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] -translate-x-1/2 -translate-y-1/2 rounded-full border will-change-transform"
        style={{
          x: ringX,
          y: ringY,
          borderColor: active ? "var(--orange)" : "var(--chalk)",
          opacity: visible ? (active ? 1 : 0.65) : 0,
        }}
        animate={{
          width: active ? 46 : 26,
          height: active ? 46 : 26,
          borderWidth: active ? 1.5 : 1.5,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[71] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          x: dotX,
          y: dotY,
          backgroundColor: active ? "transparent" : "var(--orange)",
          border: active ? "1.5px solid var(--orange)" : "none",
          opacity: visible ? 1 : 0,
        }}
        animate={{ width: active ? 8 : 5, height: active ? 8 : 5 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </>
  );
}
