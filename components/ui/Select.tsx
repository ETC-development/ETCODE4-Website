"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  optional?: boolean;
  placeholder?: string;
  options: readonly string[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, optional, placeholder, options, id, name, className, ...rest },
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
      <div className="relative">
        <select
          id={fieldId}
          name={name}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          defaultValue=""
          className={cn(
            "w-full appearance-none rounded-xl border bg-surface px-4 py-3.5 pr-11 font-body text-body text-bone transition-colors duration-300 focus:outline-none focus-visible:border-orange",
            error ? "border-orange/70" : "border-chalk/15 hover:border-chalk/30",
            className,
          )}
          {...rest}
        >
          <option value="" disabled className="text-chalk/40">
            {placeholder ?? "Select…"}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="bg-surface text-bone">
              {o}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk/50"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="font-body text-caption text-orange">
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
