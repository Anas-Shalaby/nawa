"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { uploadPatientMedia } from "@/actions/mediaActions";
import { EHR_MEDIA_TAGS, type PatientMediaTag } from "@/lib/media/types";

interface SessionMediaUploadProps {
  patientId: string;
  tenantId: string;
  sessionLabel: string;
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

export function SessionMediaUpload({
  patientId,
  sessionLabel,
  onUploaded,
  onUploadComplete,
  onUploadFailed,
}: SessionMediaUploadProps) {
  const t = useTranslations("ehr");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tag, setTag] = useState<PatientMediaTag>("before");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) return;

      setError(null);
      setUploading(true);
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      onUploaded(optimisticId, file, tag, notes);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", patientId);
      formData.append("tag", tag);
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      const result = await uploadPatientMedia(formData);
      if (!result.success || !result.media) {
        setError(result.error ?? t("uploadError"));
        onUploadFailed(optimisticId);
        setUploading(false);
        return;
      }

      onUploadComplete(optimisticId, {
        id: result.media.id,
        filePath: result.media.filePath,
        tag: result.media.tag,
        notes: result.media.notes,
        createdAt: result.media.createdAt,
      });

      setNotes("");
      setUploading(false);
      setExpanded(false);
    },
    [patientId, tag, notes, onUploaded, onUploadComplete, onUploadFailed, t],
  );

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-subtle bg-base/40 px-3 py-2.5 text-xs font-medium text-muted transition hover:border-accent/30 hover:text-accent"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t("addToSession")}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-subtle bg-base/50 p-3 text-start">
      <p className="mb-2 text-xs text-muted">
        {t("addToSessionLabel", { session: sessionLabel })}
      </p>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {EHR_MEDIA_TAGS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTag(value)}
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
              tag === value
                ? "bg-accent/15 text-accent"
                : "border border-subtle text-muted",
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
        placeholder={t("sessionNotesPlaceholder")}
        className="mb-2 w-full resize-none rounded-lg border border-subtle bg-base px-2.5 py-2 text-xs text-primary outline-none focus:border-accent"
      />

      <div
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
        onClick={() => !uploading && inputRef.current?.click()}
        className={[
          "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-xs transition",
          dragOver ? "border-accent bg-accent/5 text-accent" : "border-subtle text-muted",
          uploading ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("dropSession")
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void processFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-accent-danger">{error}</p> : null}
    </div>
  );
}
