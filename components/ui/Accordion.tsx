"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

interface AccordionProps {
  items: { q: string; a: string }[];
}

export default function Accordion({ items }: AccordionProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-chalk/12 border-y border-chalk/12">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span
                  className={cn(
                    "font-body text-[clamp(1.05rem,0.95rem+0.5vw,1.4rem)] font-semibold leading-snug transition-colors duration-300",
                    isOpen ? "text-bone" : "text-bone/80 group-hover:text-bone",
                  )}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className="relative h-4 w-4 shrink-0 text-orange"
                >
                  <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-current" />
                  <span
                    className={cn(
                      "absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-400 ease-[cubic-bezier(.87,0,.13,1)]",
                      isOpen && "rotate-90",
                    )}
                  />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={reduced ? { height: "auto" } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { height: "auto", opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="relative pb-7 pr-10">
                    <motion.span
                      aria-hidden
                      initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
                      className="mb-4 block h-px w-16 origin-left bg-orange/70"
                    />
                    <p className="max-w-[62ch] font-body text-body font-light leading-relaxed text-bone/70">
                      {item.a}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
