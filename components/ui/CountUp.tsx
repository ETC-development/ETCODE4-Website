"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

export default function CountUp({ value, duration = 1.4 }: { value: string; duration?: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";

  const [n, setN] = useState(reduced || target === null ? target ?? 0 : 0);

  useEffect(() => {
    if (target === null || reduced || !inView) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, reduced, duration]);

  if (target === null) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
