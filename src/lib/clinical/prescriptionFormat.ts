import type { PrescriptionLineInput } from "@/lib/clinical/prescriptionTypes";

/** Arabic instruction line shown on paper / WhatsApp / notes mirror. */
export function formatLineInstruction(line: PrescriptionLineInput): string {
  const dose = `${line.doseAmount.trim()} ${line.form.trim()}`.trim();
  const parts = [dose, line.frequency.trim(), line.duration.trim()].filter(Boolean);
  const core = parts.join(" — ");
  if (line.notes.trim()) {
    return `${core} — ${line.notes.trim()}`;
  }
  return core;
}

export function formatPrescriptionArabicBody(lines: PrescriptionLineInput[]): string {
  return lines
    .map((line, index) => {
      const header = `${index + 1}. ${line.medicineName}${line.isChronic ? " (مزمن)" : ""}`;
      return `${header}\n   ${formatLineInstruction(line)}`;
    })
    .join("\n");
}

export function formatPrescriptionNotesBlock(input: {
  lines: PrescriptionLineInput[];
  doctorName: string;
  dateLabel: string;
}): string {
  return [
    `—— روشتة إلكترونية ——`,
    `التاريخ: ${input.dateLabel}`,
    `الطبيب: ${input.doctorName}`,
    ``,
    `Rx`,
    formatPrescriptionArabicBody(input.lines),
    `—— نهاية الروشتة ——`,
  ].join("\n");
}

export function buildPrescriptionWhatsAppMessage(input: {
  patientName: string;
  doctorName: string;
  clinicName: string;
  dateLabel: string;
  lines: PrescriptionLineInput[];
}): string {
  const body = input.lines
    .map(
      (line, index) =>
        `${index + 1}) ${line.medicineName}\n${formatLineInstruction(line)}`,
    )
    .join("\n\n");

  return [
    `روشتة طبية — ${input.clinicName}`,
    `المريض: ${input.patientName}`,
    `الطبيب: ${input.doctorName}`,
    `التاريخ: ${input.dateLabel}`,
    ``,
    `Rx`,
    body,
    ``,
    `تم الإصدار تقنياً بواسطة نواة`,
  ].join("\n");
}

export function prescriptionQrValue(publicToken: string, origin?: string): string {
  const base = (origin ?? "").replace(/\/$/, "");
  if (base) return `${base}/rx/${publicToken}`;
  return `nawah-rx:${publicToken}`;
}
