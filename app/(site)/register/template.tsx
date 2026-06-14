"use client";

import { motion, useReducedMotion } from "motion/react";
import RouteWipe from "@/components/ui/RouteWipe";

const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

export default function RegisterTemplate({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;

  return (
    <>
      <RouteWipe />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EXPO_OUT, delay: 0.18 }}
      >
        {children}
      </motion.div>
    </>
  );
}
