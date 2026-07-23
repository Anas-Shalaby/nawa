"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Bot, Activity, BrainCircuit, Loader2, AlertCircle } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface NawahAIAssistantProps {
  patientName: string;
  allergies: string[];
  chronicDiseases: string[];
  lastDiagnosis: string | null;
  totalVisits: number;
  locale: Locale;
}

export function NawahAIAssistant({
  patientName,
  allergies,
  chronicDiseases,
  lastDiagnosis,
  totalVisits,
  locale,
}: NawahAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAr = locale === "ar";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const abortController = new AbortController();

    if (isOpen) {
      setTypedText("");
      setError(null);
      setIsLoading(true);

      async function fetchSummary() {
        try {
          const res = await fetch("/api/nawah-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientName,
              allergies,
              chronicDiseases,
              lastDiagnosis,
              totalVisits,
              locale,
            }),
            signal: abortController.signal,
          });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Failed to fetch AI summary");
          }

          setIsLoading(false);
          setIsTyping(true);
          
          let i = 0;
          // Clean up markdown bold asterisks for cleaner raw text display
          const fullSummary = (data.summary || "").replace(/\*\*/g, "");
          
          interval = setInterval(() => {
            if (i < fullSummary.length) {
              // Safely slice the full string to avoid interleaving if bugs happen
              setTypedText(fullSummary.slice(0, i + 1));
              i++;
            } else {
              setIsTyping(false);
              clearInterval(interval);
            }
          }, 20);
        } catch (err: any) {
          if (err.name === "AbortError") return;
          setIsLoading(false);
          setError(err.message || (isAr ? "حدث خطأ أثناء الاتصال بالمساعد الذكي" : "Failed to connect to AI Assistant"));
        }
      }

      fetchSummary();
    }

    return () => {
      abortController.abort();
      if (interval) clearInterval(interval);
    };
  }, [isOpen, patientName, allergies, chronicDiseases, lastDiagnosis, totalVisits, locale, isAr]);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 end-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_0_20px_rgba(108,92,231,0.5)] transition-shadow hover:shadow-[0_0_30px_rgba(108,92,231,0.8)] hide-on-print"
        aria-label="Nawah AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </motion.button>

      {/* Glassmorphism Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm hide-on-print"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 end-6 z-50 w-[360px] max-w-[calc(100vw-48px)] overflow-hidden rounded-3xl border border-white/20 bg-surface/80 p-0 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80 hide-on-print"
              dir={isAr ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-accent/20 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-primary">Nawah AI</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex gap-3">
                  <div className="mt-1 shrink-0">
                    <Bot className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-ts-none bg-elevated/50 p-4 text-sm leading-relaxed text-primary shadow-inner">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        <span className="text-xs">{isAr ? "نواة يفكر ويقرأ ملف المريض..." : "Nawah is thinking..."}</span>
                      </div>
                    ) : error ? (
                      <div className="flex items-center gap-2 text-accent-danger">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">{error}</span>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{typedText}</p>
                        {isTyping && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
                            className="inline-block h-3.5 w-1.5 bg-accent align-middle ms-1"
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {!isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    <button className="flex items-center gap-1.5 rounded-full border border-subtle bg-base/50 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-primary">
                      <Activity className="h-3 w-3 text-accent" />
                      {isAr ? "اقتراح خطة علاج" : "Suggest Treatment Plan"}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
