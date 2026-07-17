import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

interface LandingCTAProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  showArrow?: boolean;
}

const VARIANTS = {
  primary:
    "bg-accent text-white shadow-[0_0_28px_rgba(108,92,231,0.28)] hover:brightness-110",
  secondary:
    "border border-subtle bg-surface/70 text-primary hover:border-accent/35 hover:bg-surface",
  ghost:
    "border border-transparent bg-transparent text-primary hover:bg-surface/60",
} as const;

export function LandingCTA({
  href,
  children,
  variant = "primary",
  className = "",
  showArrow = true,
}: LandingCTAProps) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        VARIANTS[variant],
        className,
      ].join(" ")}
    >
      {children}
      {showArrow ? (
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
      ) : null}
    </Link>
  );
}
