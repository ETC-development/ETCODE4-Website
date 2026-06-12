"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost";
type Size = "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  magnetic?: number;
  "aria-label"?: string;
}

const base =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full font-body font-semibold uppercase tracking-[0.14em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50";

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-[0.8rem]",
  lg: "px-8 py-4 text-[0.9rem] sm:px-10 sm:py-5",
};

const variants: Record<Variant, string> = {
  solid: "bg-orange text-court hover:bg-orange/90",
  outline:
    "border border-chalk/40 text-bone hover:border-orange hover:text-orange",
  ghost: "text-bone/80 hover:text-bone",
};

export default function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "solid",
  size = "lg",
  disabled,
  className,
  magnetic = 0.35,
  ...rest
}: ButtonProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 350, damping: 22, mass: 0.5 });
  const y = useSpring(my, { stiffness: 350, damping: 22, mass: 0.5 });

  const pull = magnetic && !reduced ? magnetic : 0;

  const handleMove = (e: React.PointerEvent) => {
    if (!pull || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * pull);
    my.set((e.clientY - (r.top + r.height / 2)) * pull);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-3">{children}</span>
      {variant !== "solid" && (
        <span className="pointer-events-none absolute bottom-2 left-6 right-6 h-px origin-left scale-x-0 bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100" />
      )}
      {variant === "solid" && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-bone/20 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-full" />
      )}
    </>
  );

  const classes = cn(base, sizes[size], variants[variant], className);

  return (
    <motion.span
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ x, y }}
      className="inline-block will-change-transform"
      data-cursor="target"
    >
      {href ? (
        <Link href={href} className={classes} aria-label={rest["aria-label"]}>
          {inner}
        </Link>
      ) : (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={classes}
          aria-label={rest["aria-label"]}
        >
          {inner}
        </button>
      )}
    </motion.span>
  );
}
