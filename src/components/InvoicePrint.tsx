"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Printer, Sparkles } from "lucide-react";
import QRCode from "react-qr-code";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Locale } from "@/i18n/routing";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoicePrintData {
  invoiceNumber: string;
  dateLabel: string;
  clinicName: string;
  clinicAddress?: string;
  clinicTaxId?: string;
  clinicLogoUrl?: string;
  patientName: string;
  patientPhone: string;
  patientId: string;
  doctorName: string;
  department: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  vat: number;
  amountPaid: number;
  currency?: string;
  qrValue?: string;
}

export interface InvoicePrintHandle {
  downloadPdf: () => Promise<void>;
  print: () => void;
  getRootElement: () => HTMLDivElement | null;
}

interface InvoicePrintProps {
  data: InvoicePrintData;
  showActions?: boolean;
  className?: string;
}

/** Tahoma keeps Arabic shaping intact under html2canvas. */
const INVOICE_FONT =
  "Tahoma, 'Segoe UI', 'IBM Plex Sans Arabic', Arial, sans-serif";

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, amount));
}

export async function captureInvoicePdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const logo = element.querySelector("img");
  if (logo) {
    await new Promise<void>((resolve) => {
      if (logo.complete && logo.naturalWidth > 0) {
        resolve();
        return;
      }
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    });
  }

  const previous = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    opacity: element.style.opacity,
    zIndex: element.style.zIndex,
    pointerEvents: element.style.pointerEvents,
    transform: element.style.transform,
  };

  // Visible (opacity:1) capture — offscreen/opacity:0 breaks Arabic glyphs.
  element.style.position = "fixed";
  element.style.left = "0";
  element.style.top = "0";
  element.style.opacity = "1";
  element.style.zIndex = "-1";
  element.style.pointerEvents = "none";
  element.style.transform = "none";

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onclone: (_document, cloned) => {
        cloned.setAttribute("dir", "rtl");
        cloned.style.fontFamily = INVOICE_FONT;
        cloned.querySelectorAll<HTMLElement>("*").forEach((node) => {
          node.style.letterSpacing = "normal";
          node.style.fontFamily = INVOICE_FONT;
        });
      },
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 28;
    const usableWidth = pageWidth - margin * 2;
    const imageHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imageHeight;
    let position = margin;

    pdf.addImage(imageData, "PNG", margin, position, usableWidth, imageHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = margin - (imageHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imageData, "PNG", margin, position, usableWidth, imageHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(fileName);
  } finally {
    element.style.position = previous.position;
    element.style.left = previous.left;
    element.style.top = previous.top;
    element.style.opacity = previous.opacity;
    element.style.zIndex = previous.zIndex;
    element.style.pointerEvents = previous.pointerEvents;
    element.style.transform = previous.transform;
  }
}

export const InvoicePrint = forwardRef<InvoicePrintHandle, InvoicePrintProps>(
  function InvoicePrint({ data, showActions = true, className = "" }, ref) {
    const t = useTranslations("invoice");
    const locale = useLocale() as Locale;
    const rootRef = useRef<HTMLDivElement>(null);

    const currency = data.currency ?? t("currency");
    const logoUrl = data.clinicLogoUrl ?? "/icons/icon-192.png";
    const qrValue =
      data.qrValue ??
      `NAWA-INV:${data.invoiceNumber}|${data.patientId}|${data.dateLabel}`;

    const grandTotal = Math.max(0, data.subtotal - data.discount + data.vat);
    const remaining = Math.max(0, grandTotal - data.amountPaid);

    useImperativeHandle(ref, () => ({
      getRootElement: () => rootRef.current,
      print: () => window.print(),
      downloadPdf: async () => {
        if (!rootRef.current) return;
        await captureInvoicePdf(
          rootRef.current,
          `nawa-invoice-${data.invoiceNumber.replaceAll(/[^\w-]+/g, "")}.pdf`,
        );
      },
    }));

    return (
      <div className={["w-full", className].join(" ")} dir="rtl">
        {showActions ? (
          <div className="hide-on-print mx-auto mb-3 flex max-w-5xl items-center justify-end gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              {t("print")}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!rootRef.current) return;
                await captureInvoicePdf(
                  rootRef.current,
                  `nawa-invoice-${data.invoiceNumber.replaceAll(/[^\w-]+/g, "")}.pdf`,
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {t("downloadPdf")}
            </button>
          </div>
        ) : null}

        <article
          ref={rootRef}
          lang={locale === "ar" ? "ar" : "en"}
          dir="rtl"
          style={{ fontFamily: INVOICE_FONT }}
          className={[
            "invoice-print-root mx-auto w-full max-w-5xl rounded-2xl bg-white px-10 py-8 text-[12px] leading-relaxed text-slate-900 shadow-2xl",
            "print:w-full print:max-w-none print:rounded-none print:bg-white print:p-0 print:shadow-none",
          ].join(" ")}
        >
          {/* Task 1 — Header */}
          <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            {/* Right in RTL: Clinic identity */}
            <div className="flex min-w-0 flex-1 items-start gap-3 text-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent/10 ring-1 ring-accent/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={data.clinicName}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight text-slate-900">
                  {data.clinicName}
                </h1>
                {data.clinicAddress ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {data.clinicAddress}
                  </p>
                ) : null}
                {data.clinicTaxId ? (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {t("taxId")}:{" "}
                    <span className="tabular-nums" dir="ltr">
                      {data.clinicTaxId}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            {/* Left in RTL: Invoice metadata + QR */}
            <div className="shrink-0 text-start sm:text-end">
              <p className="text-sm font-bold text-accent">{t("taxInvoice")}</p>
              <p className="mt-1 text-[11px] font-semibold tabular-nums text-slate-800" dir="ltr">
                {data.invoiceNumber}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {t("date")}: {data.dateLabel}
              </p>
              <div className="mt-2.5 inline-flex rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm print:shadow-none">
                <QRCode
                  value={qrValue}
                  size={64}
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                  level="M"
                />
              </div>
            </div>
          </header>

          {/* Task 2 — Patient & Doctor */}
          <section className="mb-5 grid gap-4 rounded-xl bg-slate-50 px-4 py-3.5 sm:grid-cols-2 print:bg-slate-50">
            <div className="text-start">
              <p className="mb-1.5 text-[10px] font-bold text-slate-500">
                {t("patientDetails")}
              </p>
              <p className="text-[13px] font-semibold text-slate-900">{data.patientName}</p>
              <p className="mt-0.5 text-[11px] text-slate-600" dir="ltr">
                {data.patientPhone}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400" dir="ltr">
                {t("patientId")}: {data.patientId}
              </p>
            </div>
            <div className="text-start sm:border-s sm:border-slate-200 sm:ps-4">
              <p className="mb-1.5 text-[10px] font-bold text-slate-500">
                {t("doctorDetails")}
              </p>
              <p className="text-[13px] font-semibold text-slate-900">{data.doctorName}</p>
              <p className="mt-0.5 text-[11px] text-slate-600">{data.department}</p>
            </div>
          </section>

          {/* Task 3 — Line items (CSS grid) */}
          <section className="mb-5 overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 rounded-t-xl bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-600">
              <span className="text-start">{t("colDescription")}</span>
              <span className="text-center">{t("colQty")}</span>
              <span className="text-center">{t("colUnitPrice")}</span>
              <span className="text-end">{t("colTotal")}</span>
            </div>

            <ul>
              {data.lineItems.map((item, index) => {
                const lineTotal = item.quantity * item.unitPrice;
                return (
                  <li
                    key={`${item.description}-${index}`}
                    className={[
                      "grid grid-cols-[minmax(0,2.4fr)_minmax(0,0.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b border-slate-200 px-3 py-2.5 text-[12px] last:border-b-0",
                      index % 2 === 1 ? "bg-slate-50/80" : "bg-white",
                    ].join(" ")}
                  >
                    <span className="text-start font-medium text-slate-800">
                      {item.description}
                    </span>
                    <span className="text-center tabular-nums text-slate-600">
                      {item.quantity}
                    </span>
                    <span className="text-center tabular-nums text-slate-600">
                      {formatMoney(item.unitPrice, locale)} {currency}
                    </span>
                    <span className="text-end font-semibold tabular-nums text-slate-900">
                      {formatMoney(lineTotal, locale)} {currency}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Task 4 — Financial summary (end / left in RTL) */}
          <section className="mb-8 flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-start">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>{t("subtotal")}</span>
                <span className="tabular-nums">
                  {formatMoney(data.subtotal, locale)} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>{t("discount")}</span>
                <span className="tabular-nums">
                  {formatMoney(data.discount, locale)} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>{t("vat")}</span>
                <span className="tabular-nums">
                  {formatMoney(data.vat, locale)} {currency}
                </span>
              </div>

              <div className="my-2 border-t border-slate-200 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {t("grandTotal")}
                  </span>
                  <span className="text-lg font-black tabular-nums text-accent">
                    {formatMoney(grandTotal, locale)} {currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">{t("amountPaid")}</span>
                <span className="font-semibold tabular-nums text-accent-success">
                  {formatMoney(data.amountPaid, locale)} {currency}
                </span>
              </div>

              {remaining > 0 ? (
                <div className="mt-1.5 flex items-center justify-between rounded-lg border border-accent-danger/20 bg-accent-danger/5 px-3 py-1.5">
                  <span className="text-[11px] font-medium text-accent-danger">
                    {t("remaining")}
                  </span>
                  <span className="text-[12px] font-bold tabular-nums text-accent-danger">
                    {formatMoney(remaining, locale)} {currency}
                  </span>
                </div>
              ) : (
                <div className="mt-1.5 flex items-center justify-between rounded-lg border border-accent-success/20 bg-accent-success/5 px-3 py-1.5">
                  <span className="text-[11px] font-medium text-accent-success">
                    {t("paidInFull")}
                  </span>
                  <span className="text-[12px] font-bold tabular-nums text-accent-success">
                    0 {currency}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Task 5 — Nawa branding footer */}
          <footer className="border-t border-slate-200 pt-4 text-center">
            <p className="inline-flex flex-wrap items-center justify-center gap-1 text-[11px] text-slate-400">
              <span>{t("footerBefore")}</span>
              <span className="inline-flex items-center gap-0.5 font-bold text-accent">
                <Sparkles className="h-3 w-3" aria-hidden />
                {t("brandName")}
              </span>
              <span>{t("footerAfter")}</span>
            </p>
          </footer>
        </article>
      </div>
    );
  },
);
