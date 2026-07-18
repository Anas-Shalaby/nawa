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
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={ref}
          id={id}
          className={[
            "w-full rounded-xl border border-subtle bg-surface/80 py-3.5 pe-4 ps-11 text-sm text-primary",
            "placeholder:text-muted/60 transition-colors",
            "focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/25",
            error ? "border-accent-danger/50 focus:border-accent-danger focus:ring-accent-danger/20" : "",
            className,
          ].join(" ")}
          {...inputProps}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs text-accent-danger">{error}</p> : null}
    </div>
  );
});
