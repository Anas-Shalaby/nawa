"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ClipboardList, Loader2, Trash2 } from "lucide-react";
import {
  getSessionClinicalNotes,
  groupMediaIntoSessions,
  type ClinicalSession,
} from "@/lib/ehr/groupSessions";
import type { PatientMediaWithUrl } from "@/lib/media/types";
import { SessionMediaUpload } from "./SessionMediaUpload";

type OptimisticItem = PatientMediaWithUrl & { optimistic?: boolean };

interface MedicalTimelineProps {
  patientId: string;
  tenantId: string;
  items: OptimisticItem[];
  deletingId: string | null;
  compareBeforeId: string | null;
  compareAfterId: string | null;
  compareMode: boolean;
  onSelectForCompare: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenImage: (item: OptimisticItem) => void;
  onUploaded: (
    optimisticId: string,
    file: File,
    tag: OptimisticItem["tag"],
    notes: string,
  ) => void;
  onUploadComplete: (
    optimisticId: string,
    media: {
      id: string;
      filePath: string;
      tag: OptimisticItem["tag"];
      notes: string | null;
      createdAt: string;
    },
  ) => void;
  onUploadFailed: (optimisticId: string) => void;
  theater?: boolean;
}

export function MedicalTimeline({
  patientId,
  tenantId,
  items,
  deletingId,
  compareBeforeId,
  compareAfterId,
  compareMode,
  onSelectForCompare,
  onDelete,
  onOpenImage,
  onUploaded,
  onUploadComplete,
  onUploadFailed,
  theater = false,
}: MedicalTimelineProps) {
  const t = useTranslations("ehr");
  const locale = useLocale();
  const sessions = groupMediaIntoSessions(items, locale);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-subtle px-6 py-14 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-subtle bg-base">
          <ClipboardList className="h-6 w-6 text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-muted">{t("timelineEmpty")}</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 ps-1">
      {sessions.map((session, sessionIndex) => (
        <TimelineSession
          key={session.sessionKey}
          session={session}
          sessionIndex={sessionIndex}
          isLast={sessionIndex === sessions.length - 1}
          patientId={patientId}
          tenantId={tenantId}
          deletingId={deletingId}
          compareBeforeId={compareBeforeId}
          compareAfterId={compareAfterId}
          compareMode={compareMode}
          onSelectForCompare={onSelectForCompare}
          onDelete={onDelete}
          onOpenImage={onOpenImage}
          onUploaded={onUploaded}
          onUploadComplete={onUploadComplete}
          onUploadFailed={onUploadFailed}
          theater={theater}
        />
      ))}
    </ol>
  );
}

function TimelineSession({
  session,
  sessionIndex,
  isLast,
  patientId,
  tenantId,
  deletingId,
  compareBeforeId,
  compareAfterId,
  compareMode,
  onSelectForCompare,
  onDelete,
  onOpenImage,
  onUploaded,
  onUploadComplete,
  onUploadFailed,
  theater,
}: {
  session: ClinicalSession;
  sessionIndex: number;
  isLast: boolean;
  patientId: string;
  tenantId: string;
  deletingId: string | null;
  compareBeforeId: string | null;
  compareAfterId: string | null;
  compareMode: boolean;
  onSelectForCompare: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenImage: (item: OptimisticItem) => void;
  onUploaded: MedicalTimelineProps["onUploaded"];
  onUploadComplete: MedicalTimelineProps["onUploadComplete"];
  onUploadFailed: MedicalTimelineProps["onUploadFailed"];
  theater?: boolean;
}) {
  const t = useTranslations("ehr");
  const clinicalNotes = getSessionClinicalNotes(session.items);

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: sessionIndex * 0.04 }}
      className="relative flex gap-4 pb-8 text-start"
    >
      <div className="flex flex-col items-center">
        <span className="z-10 flex h-3 w-3 shrink-0 rounded-full border-2 border-accent bg-base" />
        {!isLast && <span className="mt-1 w-px flex-1 bg-subtle" aria-hidden />}
      </div>

      <div className="min-w-0 flex-1">
        <header className="mb-3 border-b border-subtle pb-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {t("sessionLabel")}
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-primary">
            {session.sessionLabel}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {t("sessionImageCount", { count: session.items.length })}
          </p>
        </header>

        {clinicalNotes.length > 0 && (
          <div className="mb-3 rounded-lg border border-subtle bg-base/60 px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              {t("clinicalNotes")}
            </p>
            <ul className="space-y-1">
              {clinicalNotes.map((note) => (
                <li key={note} className="text-sm leading-relaxed text-primary">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className={[
            "mb-3 grid gap-2",
            theater ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3",
          ].join(" ")}
        >
          {session.items.map((item) => {
            const optimisticItem = item as OptimisticItem;
            const isCompareSelected =
              compareMode &&
              (item.id === compareBeforeId || item.id === compareAfterId);

            return (
              <article
                key={item.id}
                className={[
                  "group overflow-hidden rounded-lg border bg-surface transition",
                  isCompareSelected
                    ? "border-accent ring-1 ring-accent/40"
                    : "border-subtle",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() =>
                    compareMode ? onSelectForCompare(item.id) : onOpenImage(optimisticItem)
                  }
                  className="relative block w-full"
                >
                  {item.signedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.signedUrl}
                      alt={t(`tags.${item.tag}`)}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-base text-xs text-muted">
                      {t("imageUnavailable")}
                    </div>
                  )}
                  <span className="absolute start-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {t(`tags.${item.tag}`)}
                  </span>
                </button>

                {!optimisticItem.optimistic && !compareMode && (
                  <div className="flex justify-end px-1 py-1">
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item.id)}
                      className="rounded p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:text-accent-danger disabled:opacity-50"
                      aria-label={t("delete")}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <SessionMediaUpload
          patientId={patientId}
          tenantId={tenantId}
          sessionLabel={session.sessionLabel}
          onUploaded={onUploaded}
          onUploadComplete={onUploadComplete}
          onUploadFailed={onUploadFailed}
        />
      </div>
    </motion.li>
  );
}
