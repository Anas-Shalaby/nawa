import type { ReactNode } from "react";

interface MarketingCardProps {
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
}

export function MarketingCard({
  children,
  className = "",
  highlighted = false,
}: MarketingCardProps) {
  return (
    <div
      className={[
        "rounded-[1.5rem] border p-6 md:p-7",
        highlighted
          ? "border-accent/35 bg-surface/90 shadow-[0_0_40px_rgba(108,92,231,0.12)]"
          : "border-subtle/80 bg-surface/70",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
