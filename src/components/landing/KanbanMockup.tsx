"use client";

import { motion } from "framer-motion";

const CARDS = [
  { label: "جديد", color: "#6C5CE7", offset: 0 },
  { label: "تم التأكيد", color: "#00CEC9", offset: 18 },
  { label: "تم الحضور", color: "#74B9FF", offset: 36 },
];

export function KanbanMockup() {
  return (
    <div className="relative mx-auto h-[320px] w-full max-w-md" dir="ltr" aria-hidden>
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-accent/20 via-transparent to-accent-success/10 blur-3xl" />

      {CARDS.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 24, rotate: index === 0 ? -4 : index === 2 ? 4 : 0 }}
          animate={{
            opacity: 1,
            y: [card.offset, card.offset - 8, card.offset],
            rotate: index === 0 ? -4 : index === 2 ? 4 : 0,
          }}
          transition={{
            opacity: { delay: 0.2 + index * 0.12, duration: 0.4 },
            y: { delay: 0.8 + index * 0.2, duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute left-1/2 w-[78%] -translate-x-1/2 rounded-2xl border border-white/10 bg-surface/90 p-4 shadow-2xl backdrop-blur-md dark:border-subtle/80"
          style={{ top: `${48 + index * 72}px`, zIndex: 10 + index }}
        >
          <div
            className="mb-3 h-1 w-12 rounded-full"
            style={{ backgroundColor: card.color }}
          />
          <div className="mb-2 h-3 w-24 rounded-full bg-white/10 dark:bg-subtle/80" />
          <div className="h-2.5 w-32 rounded-full bg-white/5 dark:bg-subtle/50" />
          <p className="mt-4 text-xs font-medium" style={{ color: card.color }}>
            {card.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
