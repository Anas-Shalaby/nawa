"use client";

import { useState } from "react";
import { Image as ImageIcon, Maximize2, X } from "lucide-react";

interface MediaEventCardProps {
  url: string;
  tag: string;
  notes: string | null | undefined;
  dateLabel: string;
  locale: string;
}

export function MediaEventCard({
  url,
  tag,
  notes,
  dateLabel,
  locale,
}: MediaEventCardProps) {
  const isAr = locale === "ar";
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div className="bg-elevated/20 border border-subtle/50 rounded-2xl p-4 text-start">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase">
            <ImageIcon className="h-3 w-3" />
            {tag || (isAr ? "ملف طبي" : "Attachment")}
          </span>
          <p className="text-[11px] text-muted mt-1">{dateLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Main Image View */}
        <div className="relative group overflow-hidden rounded-xl border border-subtle/80 bg-surface max-w-[280px]">
          <img
            src={url}
            alt={tag || "Medical Attachment"}
            className="w-full h-auto object-cover max-h-[180px] transition group-hover:scale-[1.02] duration-300"
          />
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="absolute bottom-2 end-2 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition duration-200"
          >
            <Maximize2 className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Notes */}
        {notes?.trim() && (
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-surface/60 border border-subtle/40 rounded-xl p-2.5 max-w-[280px]">
            {notes}
          </p>
        )}
      </div>

      {/* Click-to-Zoom Fullscreen Overlay */}
      {zoomOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="absolute -top-10 end-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={url}
              alt={tag}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {notes?.trim() && (
              <p className="mt-4 text-sm text-slate-200 bg-black/40 px-4 py-2 rounded-xl text-center">
                {notes}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
