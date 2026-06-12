"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { frame, cancelFrame } from "motion/react";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      autoRaf: false,
    });

    function update(data: { timestamp: number }) {
      lenis.raf(data.timestamp);
    }
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
