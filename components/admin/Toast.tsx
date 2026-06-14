"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/**
 * App-wide admin toaster. One live region (bottom-right, non-layout-shifting),
 * so every action's feedback is consistent and announced to assistive tech —
 * replacing the per-component setTimeout flashes.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), kind === "error" ? 5000 : 3000);
    },
    [remove],
  );

  const api: ToastApi = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            onClick={() => remove(t.id)}
            className={cn(
              "pointer-events-auto w-full max-w-sm cursor-pointer rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur transition-all",
              "motion-safe:animate-[toast-in_.25s_var(--ease-expo-out)]",
              t.kind === "success" &&
                "border-orange/30 bg-surface-2/95 text-bone",
              t.kind === "error" && "border-danger/40 bg-surface-2/95 text-bone",
              t.kind === "info" && "border-bone/15 bg-surface-2/95 text-bone",
            )}
          >
            <span className="flex items-start gap-2">
              <span
                aria-hidden
                className={cn(
                  "mt-1 size-2 shrink-0 rounded-full",
                  t.kind === "success" && "bg-orange",
                  t.kind === "error" && "bg-danger",
                  t.kind === "info" && "bg-chalk",
                )}
              />
              <span>{t.message}</span>
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No provider (e.g. a component rendered outside admin) — no-op so callers
    // never crash.
    return { toast: () => {}, success: () => {}, error: () => {} };
  }
  return ctx;
}
