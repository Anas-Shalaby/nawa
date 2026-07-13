"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const DOCTORS = ["d1", "d2", "d3"] as const;

export function TrustSection() {
  const t = useTranslations("landing.trust");

  return (
    <section id="trust" className="border-y border-subtle/50 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-10 max-w-2xl text-start"
        >
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {DOCTORS.map((key, index) => (
            <motion.article
              key={key}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="rounded-2xl border border-subtle/70 bg-surface/50 p-6 text-start backdrop-blur-sm"
            >
              <div className="mb-4 flex gap-0.5" aria-label={t("ratingLabel")}>
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    className="h-4 w-4 fill-accent-warning text-accent-warning"
                    aria-hidden
                  />
                ))}
              </div>

              <p className="text-sm leading-relaxed text-muted">
                “{t(`${key}.quote`)}”
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white",
                    index === 0
                      ? "bg-accent"
                      : index === 1
                        ? "bg-accent-success"
                        : "bg-sky-500",
                  ].join(" ")}
                >
                  {t(`${key}.initials`)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{t(`${key}.name`)}</p>
                  <p className="text-xs text-muted">{t(`${key}.role`)}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
