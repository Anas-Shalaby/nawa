"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Columns2,
  GitCompareArrows,
  Loader2,
  MonitorPlay,
  Stethoscope,
  X,
} from "lucide-react";
import { deletePatientMediaRecord } from "@/actions/mediaActions";
import { createClient } from "@/utils/supabase/client";
import { createSignedEhrUrls } from "@/lib/media/storage";
import type { PatientMediaRecord, PatientMediaWithUrl } from "@/lib/media/types";
import { BeforeAfterCompare } from "./BeforeAfterCompare";
import { MediaLightbox } from "./MediaLightbox";
import { MedicalTimeline } from "./MedicalTimeline";
import { useTheaterMode } from "./TheaterModeContext";

type EhrView = "timeline" | "compare";
type OptimisticItem = PatientMediaWithUrl & { optimistic?: boolean };

/** Stable empty default — avoids re-running effects when `initialMedia` is omitted. */
const EMPTY_INITIAL_MEDIA: PatientMediaRecord[] = [];

interface PatientVisualEhrProps {
  patientId: string;
  patientName: string;
  tenantId: string;
  initialMedia?: PatientMediaRecord[];
  compact?: boolean;
}

export function PatientVisualEhr({
  patientId,
  patientName,
  tenantId,
  initialMedia = EMPTY_INITIAL_MEDIA,
  compact = false,
}: PatientVisualEhrProps) {
  const t = useTranslations("ehr");
  const { isTheater, enterTheater, exitTheater } = useTheaterMode();

  const [items, setItems] = useState<OptimisticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<EhrView>("timeline");
  const [compareBeforeId, setCompareBeforeId] = useState<string | null>(null);
  const [compareAfterId, setCompareAfterId] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<OptimisticItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hydrateUrls = useCallback(async (records: PatientMediaRecord[]) => {
    const urls = await createSignedEhrUrls(records.map((record) => record.filePath));
    return records.map((record) => ({
      ...record,
      signedUrl: urls[record.filePath] ?? null,
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let records = initialMedia;

      if (records.length === 0) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("patient_media")
          .select("id, tenant_id, patient_id, file_path, tag, notes, created_at")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (error) {
          if (!cancelled) setLoading(false);
          return;
        }

        records = (data ?? []).map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          patientId: row.patient_id,
          filePath: row.file_path,
          tag: row.tag,
          notes: row.notes,
          createdAt: row.created_at,
        }));
      }

      const hydrated = await hydrateUrls(records);
      if (!cancelled) {
        setItems(hydrated);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [patientId, hydrateUrls, initialMedia]);

  useEffect(() => {
    if (!isTheater) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") exitTheater();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTheater, exitTheater]);

  function handleOptimisticUpload(
    optimisticId: string,
    file: File,
    tag: OptimisticItem["tag"],
    notes: string,
  ) {
    const previewUrl = URL.createObjectURL(file);
    setItems((current) => [
      {
        id: optimisticId,
        tenantId,
        patientId,
        filePath: "",
        tag,
        notes: notes || null,
        createdAt: new Date().toISOString(),
        signedUrl: previewUrl,
        optimistic: true,
      },
      ...current,
    ]);
  }

  async function handleUploadComplete(
    optimisticId: string,
    media: {
      id: string;
      filePath: string;
      tag: OptimisticItem["tag"];
      notes: string | null;
      createdAt: string;
    },
  ) {
    const urls = await createSignedEhrUrls([media.filePath]);
    setItems((current) =>
      current.map((item) => {
        if (item.id !== optimisticId) return item;
        if (item.signedUrl?.startsWith("blob:")) URL.revokeObjectURL(item.signedUrl);
        return {
          id: media.id,
          tenantId,
          patientId,
          filePath: media.filePath,
          tag: media.tag,
          notes: media.notes,
          createdAt: media.createdAt,
          signedUrl: urls[media.filePath] ?? null,
        };
      }),
    );
  }

  function handleUploadFailed(optimisticId: string) {
    setItems((current) => {
      const failed = current.find((item) => item.id === optimisticId);
      if (failed?.signedUrl?.startsWith("blob:")) URL.revokeObjectURL(failed.signedUrl);
      return current.filter((item) => item.id !== optimisticId);
    });
  }

  async function handleDelete(mediaId: string) {
    setDeletingId(mediaId);
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== mediaId));
    const result = await deletePatientMediaRecord(mediaId);
    if (!result.success) setItems(previous);
    setDeletingId(null);
  }

  function handleCompareSelect(id: string) {
    if (!compareBeforeId || (compareBeforeId && compareAfterId)) {
      setCompareBeforeId(id);
      setCompareAfterId(null);
      return;
    }
    if (compareBeforeId === id) return;
    setCompareAfterId(id);
  }

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-3">
      <div className="flex gap-1 rounded-lg border border-subtle bg-base/60 p-1">
        <ViewTab
          active={view === "timeline"}
          onClick={() => setView("timeline")}
          icon={Columns2}
          label={t("viewTimeline")}
        />
        <ViewTab
          active={view === "compare"}
          onClick={() => setView("compare")}
          icon={GitCompareArrows}
          label={t("viewCompare")}
        />
      </div>

      {!compact && (
        <button
          type="button"
          onClick={() => (isTheater ? exitTheater() : enterTheater(patientName))}
          className={[
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition",
            isTheater
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-subtle text-muted hover:border-accent/30 hover:text-accent",
          ].join(" ")}
        >
          {isTheater ? (
            <X className="h-4 w-4" aria-hidden />
          ) : (
            <MonitorPlay className="h-4 w-4" aria-hidden />
          )}
          {isTheater ? t("exitTheater") : t("enterTheater")}
        </button>
      )}
    </div>
  );

  const body = loading ? (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  ) : view === "timeline" ? (
    <MedicalTimeline
      patientId={patientId}
      tenantId={tenantId}
      items={items}
      deletingId={deletingId}
      compareBeforeId={compareBeforeId}
      compareAfterId={compareAfterId}
      compareMode={false}
      onSelectForCompare={handleCompareSelect}
      onDelete={(id) => void handleDelete(id)}
      onOpenImage={setLightboxItem}
      onUploaded={handleOptimisticUpload}
      onUploadComplete={handleUploadComplete}
      onUploadFailed={handleUploadFailed}
      theater={isTheater}
    />
  ) : (
    <BeforeAfterCompare
      items={items}
      beforeId={compareBeforeId}
      afterId={compareAfterId}
      onSelectBefore={setCompareBeforeId}
      onSelectAfter={setCompareAfterId}
      theater={isTheater}
    />
  );

  const content = (
    <div className={isTheater ? "mx-auto max-w-6xl space-y-6 p-6 sm:p-10" : "space-y-4"}>
      {isTheater && (
        <header className="flex items-center gap-3 border-b border-subtle pb-4 text-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-subtle bg-surface">
            <Stethoscope className="h-5 w-5 text-accent" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              {t("theaterMode")}
            </p>
            <h2 className="text-lg font-semibold text-primary">{patientName}</h2>
          </div>
        </header>
      )}
      {toolbar}
      {body}
    </div>
  );

  return (
    <>
      {!isTheater && content}
      <AnimatePresence>
        {isTheater && (
          <motion.div
            key="theater"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] overflow-y-auto bg-base"
            role="dialog"
            aria-modal="true"
            aria-label={t("theaterMode")}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
      <MediaLightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </>
  );
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Columns2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-accent/15 text-accent" : "text-muted hover:text-primary",
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
