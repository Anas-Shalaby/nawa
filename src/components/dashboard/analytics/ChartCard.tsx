"use client";

import { motion } from "framer-motion";

interface ChartCardProps {
  title: string;
  hint: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ChartCard({ title, hint, children, delay = 0, className = "" }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={[
        "rounded-2xl border border-subtle/50 bg-surface/80 px-5 py-5 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      <div className="mb-4 text-start">
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
      </div>
      {children}
    </motion.div>
  );
}
