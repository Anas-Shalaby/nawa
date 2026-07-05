"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, MessageCircle } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import {
  buildWhatsAppActionUrl,
  type WhatsAppTemplateKey,
} from "@/lib/whatsapp/templates";

export interface WhatsAppActionMenuProps {
  phoneNumber: string;
  patientName: string;
  amountDue?: number;
  appointmentDate?: string;
  /** Which templates to show. Defaults to all three. */
  templates?: WhatsAppTemplateKey[];
  className?: string;
  variant?: "primary" | "ghost";
}

const ALL_TEMPLATES: WhatsAppTemplateKey[] = ["appointment", "financial", "recall"];

export function WhatsAppActionMenu({
  phoneNumber,
  patientName,
  amountDue = 0,
  appointmentDate,
  templates = ALL_TEMPLATES,
  className = "",
  variant = "primary",
}: WhatsAppActionMenuProps) {
  const t = useTranslations("whatsapp");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const labelKeys: Record<WhatsAppTemplateKey, string> = {
    appointment: "appointmentReminder",
    financial: "financialDue",
    recall: "recallInvite",
  };

  const buttonClass =
    variant === "primary"
      ? "bg-[#25D366] text-white hover:bg-[#20BD5A]"
      : "border border-subtle bg-surface text-primary hover:bg-elevated";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
          "text-sm font-medium transition",
          buttonClass,
        ].join(" ")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
        <span>{t("openMenu")}</span>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className={[
            "absolute z-20 mt-2 w-full min-w-[220px] overflow-hidden rounded-xl",
            "border border-subtle bg-surface shadow-lg",
            "start-0",
          ].join(" ")}
        >
          {templates.map((key) => {
            const href = buildWhatsAppActionUrl(phoneNumber, key, {
              patientName,
              amountDue,
              appointmentDate,
              locale,
            });

            return (
              <a
                key={key}
                role="menuitem"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={[
                  "block border-b border-subtle px-4 py-3 text-start text-sm",
                  "text-primary transition last:border-b-0 hover:bg-elevated",
                ].join(" ")}
              >
                <span className="font-medium">{t(labelKeys[key])}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
