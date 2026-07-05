"use client";

import { motion } from "framer-motion";
import { Bot, Megaphone, Package, Sparkles, UserCog, type LucideIcon } from "lucide-react";

const COMING_SOON_ICONS = {
  sparkles: Sparkles,
  userCog: UserCog,
  package: Package,
  megaphone: Megaphone,
  bot: Bot,
} satisfies Record<string, LucideIcon>;

export type ComingSoonIcon = keyof typeof COMING_SOON_ICONS;

interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
  badge?: string;
  icon?: ComingSoonIcon;
}

export function ComingSoonPlaceholder({
  title,
  description,
  badge = "قريباً",
  icon = "sparkles",
}: ComingSoonPlaceholderProps) {
  const Icon = COMING_SOON_ICONS[icon];
  return (
    <div className="mx-auto flex min-h-[min(520px,70vh)] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="relative mb-8"
      >
        <div
          className="absolute inset-0 -m-6 rounded-full bg-accent/20 blur-2xl"
          aria-hidden
        />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={[
            "relative flex h-24 w-24 items-center justify-center rounded-3xl",
            "border border-subtle bg-gradient-to-br from-surface via-elevated to-base",
            "shadow-[0_0_40px_rgba(108,92,231,0.15)]",
          ].join(" ")}
        >
          <Icon className="h-10 w-10 text-accent" strokeWidth={1.5} aria-hidden />
        </motion.div>
        <motion.span
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute -end-1 -top-1 h-3 w-3 rounded-full bg-accent"
          aria-hidden
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-start sm:text-center"
      >
        <span className="mb-3 inline-block rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {badge}
        </span>
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-10 flex gap-1.5"
        aria-hidden
      >
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-accent/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
