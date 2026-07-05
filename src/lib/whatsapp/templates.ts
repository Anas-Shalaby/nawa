import { toWhatsAppUrl } from "@/lib/phone/whatsapp";

export type WhatsAppTemplateKey = "appointment" | "financial" | "recall";

export interface WhatsAppTemplateContext {
  patientName: string;
  appointmentDate?: string;
  amountDue?: number;
  locale?: string;
}

function formatAmount(amount: number, locale = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppTemplateMessage(
  key: WhatsAppTemplateKey,
  context: WhatsAppTemplateContext,
): string {
  const name = context.patientName.trim();
  const locale = context.locale ?? "ar";

  switch (key) {
    case "appointment": {
      const date = context.appointmentDate ?? (locale === "ar" ? "قريباً" : "soon");
      return locale === "ar"
        ? `مرحباً ${name}، نذكرك بموعدك في العيادة بتاريخ ${date}. يرجى الحضور قبل 10 دقائق. شكراً لتعاونك.`
        : `Hello ${name}, this is a reminder for your clinic appointment on ${date}. Please arrive 10 minutes early. Thank you.`;
    }
    case "financial": {
      const amount = formatAmount(context.amountDue ?? 0, locale);
      return locale === "ar"
        ? `مرحباً ${name}، نذكرك بوجود دفعة مستحقة بقيمة ${amount} جنيه. يمكنك التواصل معنا لترتيب السداد. شكراً لتفهمك.`
        : `Hello ${name}, you have an outstanding balance of ${amount} EGP. Please contact us to arrange payment. Thank you.`;
    }
    case "recall": {
      return locale === "ar"
        ? `مرحباً ${name}، حان موعد فحصك الدوري في العيادة. نود حجز موعد مناسب لك — رد على هذه الرسالة وسنساعدك فوراً.`
        : `Hello ${name}, it's time for your routine check-up. Reply to this message and we'll book a convenient slot for you.`;
    }
    default:
      return `مرحباً ${name}`;
  }
}

export function buildWhatsAppActionUrl(
  phone: string,
  key: WhatsAppTemplateKey,
  context: WhatsAppTemplateContext,
): string {
  const message = buildWhatsAppTemplateMessage(key, context);
  const base = toWhatsAppUrl(phone);
  return `${base}?text=${encodeURIComponent(message)}`;
}
