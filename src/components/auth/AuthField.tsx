"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, icon: Icon, error, className = "", ...inputProps },
  ref,
) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-400">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={ref}
          id={id}
          className={[
            "w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3.5 pe-4 ps-11 text-sm text-slate-100",
            "placeholder:text-slate-600 transition-colors",
            "focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-700",
            error ? "border-red-900/60 focus:border-red-800 focus:ring-red-950" : "",
            className,
          ].join(" ")}
          {...inputProps}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-400/90">{error}</p> : null}
    </div>
  );
});
