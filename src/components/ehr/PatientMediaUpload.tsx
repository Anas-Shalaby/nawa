"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Camera, Loader2, Upload } from "lucide-react";
import { insertPatientMediaRecord } from "@/actions/mediaActions";
import { uploadEhrImageToStorage } from "@/lib/media/storage";
import { EHR_MEDIA_TAGS, type PatientMediaTag } from "@/lib/media/types";

interface PatientMediaUploadProps {
  patientId: string;
  tenantId: string;
  onUploaded: (optimisticId: string, file: File, tag: PatientMediaTag, notes: string) => void;
  onUploadComplete: (
    optimisticId: string,
    media: {
      id: string;
      filePath: string;
      tag: PatientMediaTag;
      notes: string | null;
      createdAt: string;
    },
  ) => void;
  onUploadFailed: (optimisticId: string) => void;
}

export function PatientMediaUpload({
  patientId,
  tenantId,
  onUploaded,
  onUploadComplete,
  onUploadFailed,
}: PatientMediaUploadProps) {
  const t = useTranslations("ehr");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tag, setTag] = useState<PatientMediaTag>("before");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) return;

      setError(null);
      setUploading(true);

      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      onUploaded(optimisticId, file, tag, notes);

      const uploadResult = await uploadEhrImageToStorage(file, tenantId, patientId);
      if ("error" in uploadResult) {
        setError(uploadResult.error);
        onUploadFailed(optimisticId);
        setUploading(false);
        return;
      }

      const recordResult = await insertPatientMediaRecord({
        patientId,
        filePath: uploadResult.filePath,
        tag,
        notes: notes || null,
      });

      if (!recordResult.success || !recordResult.media) {
        setError(recordResult.error ?? t("uploadError"));
        onUploadFailed(optimisticId);
        setUploading(false);
        return;
      }

      onUploadComplete(optimisticId, {
        id: recordResult.media.id,
        filePath: recordResult.media.filePath,
        tag: recordResult.media.tag,
        notes: recordResult.media.notes,
        createdAt: recordResult.media.createdAt,
      });

      setNotes("");
      setUploading(false);
    },
    [patientId, tenantId, tag, notes, onUploaded, onUploadComplete, onUploadFailed, t],
  );

  return (
    <div className="space-y-3 text-start">
      <div className="flex flex-wrap gap-2">
        {EHR_MEDIA_TAGS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTag(value)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              tag === value
                ? "bg-accent/15 text-accent"
                : "border border-subtle text-muted hover:text-primary",
            ].join(" ")}
          >
            {t(`tags.${value}`)}
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
        placeholder={t("notesPlaceholder")}
        className="w-full resize-none rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary outline-none transition focus:border-accent"
      />

      <motion.div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!uploading) void processFiles(event.dataTransfer.files);
        }}
        className={[
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 transition",
          dragOver ? "border-accent bg-accent/5" : "border-subtle bg-base/40",
          uploading ? "pointer-events-none opacity-60" : "cursor-pointer hover:border-accent/40",
        ].join(" ")}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-subtle bg-gradient-to-br from-accent/20 via-surface to-base"
          style={{ transform: "perspective(400px) rotateX(6deg)" }}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          ) : (
            <Camera className="h-6 w-6 text-accent" strokeWidth={1.5} />
          )}
        </div>
        <p className="text-sm font-medium text-primary">{t("dropTitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("dropHint")}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent">
          <Upload className="h-3.5 w-3.5" aria-hidden />
          {t("browse")}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void processFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </motion.div>

      {error && <p className="text-xs text-accent-danger">{error}</p>}
    </div>
  );
}
