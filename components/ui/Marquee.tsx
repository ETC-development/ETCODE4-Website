"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: string[];
  speed?: number;
  reverse?: boolean;
  className?: string;
}

export default function Marquee({ items, speed = 28, reverse = false, className }: MarqueeProps) {
  const reduced = useReducedMotion();
  const track = [...items, ...items];

  const Sep = () => (
    <span aria-hidden className="mx-6 inline-block h-2.5 w-2.5 rounded-full bg-orange sm:mx-10" />
  );

  return (
    <div
      className={cn("relative flex overflow-hidden border-y border-chalk/10 py-5", className)}
      role="presentation"
    >
      <motion.div
        className="flex shrink-0 items-center whitespace-nowrap"
        animate={reduced ? undefined : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={reduced ? undefined : { duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {track.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="font-display text-[clamp(1.4rem,1rem+2vw,2.6rem)] uppercase tracking-tight text-bone/80">
              {item}
            </span>
            <Sep />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
