"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div";

interface RevealTextProps {
  text: string;
  as?: Tag;
  id?: string;
  className?: string;
  split?: "word" | "line";
  delay?: number;
  stagger?: number;
  trigger?: "mount" | "view";
  once?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function RevealText({
  text,
  as = "p",
  id,
  className,
  split = "word",
  delay = 0,
  stagger = 0.06,
  trigger = "view",
  once = true,
}: RevealTextProps) {
  const reduced = useReducedMotion();
  const Comp = motion[as];
  const units = split === "line" ? text.split("\n") : text.split(" ");

  if (reduced) {
    const Static = as;
    return (
      <Static id={id} className={className}>
        {text}
      </Static>
    );
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const child: Variants = {
    hidden: { y: "115%" },
    show: { y: "0%", transition: { duration: 0.85, ease: EASE } },
  };

  const animateProps =
    trigger === "mount"
      ? { initial: "hidden" as const, animate: "show" as const }
      : {
          initial: "hidden" as const,
          whileInView: "show" as const,
          viewport: { once, margin: "-12% 0px -12% 0px" },
        };

  return (
    <Comp id={id} className={cn("inline-flex flex-wrap", className)} variants={container} {...animateProps}>
      {units.map((u, i) => (
        <span key={i} className="inline-flex overflow-hidden pb-[0.12em]">
          <motion.span variants={child} className="inline-block will-change-transform">
            {u}
            {split === "word" && i < units.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Comp>
  );
}
