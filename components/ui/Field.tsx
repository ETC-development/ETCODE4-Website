"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, optional, id, name, className, ...rest },
  ref,
) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="flex items-baseline justify-between font-body text-caption font-medium uppercase tracking-[0.16em] text-chalk/70"
      >
        <span>{label}</span>
        {optional && <span className="text-chalk/35">optional</span>}
      </label>
      <input
        id={fieldId}
        name={name}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          "w-full rounded-xl border bg-surface px-4 py-3.5 font-body text-body text-bone placeholder:text-chalk/30 transition-colors duration-300 focus:outline-none focus-visible:border-orange",
          error ? "border-orange/70" : "border-chalk/15 hover:border-chalk/30",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="font-body text-caption text-orange">
          {error}
        </p>
      ) : hint ? (
        <p className="font-body text-caption text-chalk/45">{hint}</p>
      ) : null}
    </div>
  );
});

export default Field;
