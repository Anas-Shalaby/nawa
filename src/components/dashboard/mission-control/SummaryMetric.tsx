"use client";

import { motion } from "framer-motion";

interface SummaryMetricProps {
  label: string;
  value: string | number;
  tone?: "neutral" | "warning" | "danger" | "success";
  onClick?: () => void;
  ariaLabel?: string;
}

const toneClasses: Record<NonNullable<SummaryMetricProps["tone"]>, string> = {
  neutral: "text-primary",
  warning: "text-accent-warning",
  danger: "text-accent-danger",
  success: "text-accent-success",
};

export function SummaryMetric({
  label,
  value,
  tone = "neutral",
  onClick,
  ariaLabel,
}: SummaryMetricProps) {
  const className = [
    "flex min-w-[4.5rem] flex-col rounded-xl border border-subtle bg-elevated/50 px-3 py-2 text-start transition",
    onClick ? "cursor-pointer hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" : "",
  ].join(" ");

  const content = (
    <>
      <span className="text-[10px] font-medium text-muted">{label}</span>
      <motion.span
        key={String(value)}
        initial={{ opacity: 0.6, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={["text-lg font-semibold tabular-nums", toneClasses[tone]].join(" ")}
      >
        {value}
      </motion.span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-label={ariaLabel ?? label}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
