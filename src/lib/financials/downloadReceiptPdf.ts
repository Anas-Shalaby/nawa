import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface ReceiptPdfInput {
  transactionId: string;
  dateLabel: string;
  typeLabel: string;
  subjectName: string;
  serviceName: string;
  amountLabel: string;
  currencyLabel: string;
  title: string;
  clinicLabel: string;
  idLabel: string;
  dateFieldLabel: string;
  typeFieldLabel: string;
  subjectFieldLabel: string;
  serviceFieldLabel: string;
  amountFieldLabel: string;
  footer: string;
  fileName?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Premium compact receipt PDF (original Nawa design).
 * Uses Tahoma for correct Arabic shaping.
 */
export async function downloadReceiptPdf(input: ReceiptPdfInput): Promise<void> {
  const logoUrl = `${window.location.origin}/icons/icon-192.png`;

  const host = document.createElement("div");
  host.setAttribute("dir", "rtl");
  host.style.cssText =
    "position:fixed;left:0;top:0;width:420px;background:#ffffff;color:#111827;opacity:0;pointer-events:none;z-index:-1;";

  host.innerHTML = `
    <div style="font-family:Tahoma,'Segoe UI',Arial,sans-serif;padding:28px;border:1px solid #e5e7eb;border-radius:16px;letter-spacing:normal;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;">
        <div style="text-align:right;">
          <p style="margin:0;font-size:12px;color:#6b7280;letter-spacing:normal;">${escapeHtml(input.clinicLabel)}</p>
          <h1 style="margin:4px 0 0;font-size:22px;color:#111827;font-weight:700;letter-spacing:normal;">${escapeHtml(input.title)}</h1>
        </div>
        <img
          src="${escapeHtml(logoUrl)}"
          alt="Nawa"
          width="48"
          height="48"
          style="width:48px;height:48px;border-radius:12px;object-fit:cover;display:block;flex-shrink:0;"
        />
      </div>
      <div style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:14px 0;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;letter-spacing:normal;">${escapeHtml(input.idLabel)}</p>
        <p style="margin:0;font-size:13px;color:#111827;word-break:break-all;letter-spacing:normal;" dir="ltr">${escapeHtml(input.transactionId)}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;letter-spacing:normal;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;text-align:right;">${escapeHtml(input.dateFieldLabel)}</td>
          <td style="padding:8px 0;text-align:left;color:#111827;font-weight:600;">${escapeHtml(input.dateLabel)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;text-align:right;">${escapeHtml(input.typeFieldLabel)}</td>
          <td style="padding:8px 0;text-align:left;color:#111827;font-weight:600;">${escapeHtml(input.typeLabel)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;text-align:right;">${escapeHtml(input.subjectFieldLabel)}</td>
          <td style="padding:8px 0;text-align:left;color:#111827;font-weight:600;">${escapeHtml(input.subjectName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;text-align:right;">${escapeHtml(input.serviceFieldLabel)}</td>
          <td style="padding:8px 0;text-align:left;color:#111827;font-weight:600;">${escapeHtml(input.serviceName)}</td>
        </tr>
      </table>
      <div style="margin-top:18px;padding:14px;border-radius:12px;background:#f5f3ff;border:1px solid #ddd6fe;">
        <p style="margin:0;font-size:12px;color:#6b7280;letter-spacing:normal;">${escapeHtml(input.amountFieldLabel)}</p>
        <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:#6C5CE7;letter-spacing:normal;">
          ${escapeHtml(input.amountLabel)}
          <span style="font-size:14px;font-weight:600;color:#4c1d95;">${escapeHtml(input.currencyLabel)}</span>
        </p>
      </div>
      <p style="margin:18px 0 0;font-size:11px;color:#9ca3af;text-align:center;letter-spacing:normal;">${escapeHtml(input.footer)}</p>
    </div>
  `;

  document.body.appendChild(host);

  try {
    const logo = host.querySelector("img");
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

    // Make visible only for capture (opacity:0 breaks some browsers' text rasterization).
    host.style.opacity = "1";

    const canvas = await html2canvas(host, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    host.style.opacity = "0";

    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    const usableWidth = pageWidth - margin * 2;
    const imageHeight = (canvas.height * usableWidth) / canvas.width;

    pdf.addImage(imageData, "PNG", margin, margin, usableWidth, imageHeight);
    pdf.save(input.fileName ?? `nawa-receipt-${input.transactionId.slice(0, 8)}.pdf`);
  } finally {
    host.remove();
  }
}
