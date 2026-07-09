"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  archivePatient,
  clearPatientWarning,
  deletePatient,
  restorePatient,
} from "@/actions/managePatients";
import { matchesPatientSearch } from "@/lib/patients/search";
import type { PatientRecord } from "@/lib/queries/patients";
import { PatientFormModal, type PatientFormValues } from "./PatientFormModal";

type PatientFilter = "active" | "warning" | "archived";

interface PatientsShellProps {
  patients: PatientRecord[];
}

function matchesFilter(patient: PatientRecord, filter: PatientFilter): boolean {
  if (filter === "archived") return patient.isArchived;
  if (patient.isArchived) return false;
  if (filter === "warning") return patient.noShowCount === 1;
  return patient.noShowCount !== 1;
}

export function PatientsShell({
  patients: initialPatients,
}: PatientsShellProps) {
  const t = useTranslations("patients");
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PatientFilter>("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(
    null,
  );
  const [deletingPatient, setDeletingPatient] = useState<PatientRecord | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setPatients(initialPatients);
  }, [initialPatients]);

  const filtered = useMemo(() => {
    const query = search.trim();
    const searching = query.length > 0;

    return patients.filter((patient) => {
      if (!searching && !matchesFilter(patient, filter)) return false;
      return matchesPatientSearch(
        { name: patient.name, phoneNumber: patient.phoneNumber },
        query,
      );
    });
  }, [patients, search, filter]);

  function openCreate() {
    setEditingPatient(null);
    setModalOpen(true);
  }

  function openEdit(patient: PatientRecord) {
    setEditingPatient(patient);
    setModalOpen(true);
  }

  function handleSaved(values: PatientFormValues, patientId?: string) {
    setModalOpen(false);

    if (editingPatient) {
      setPatients((current) =>
        current.map((patient) =>
          patient.id === editingPatient.id
            ? {
                ...patient,
                name: values.name,
                phoneNumber: values.whatsapp,
                notes: values.notes || null,
              }
            : patient,
        ),
      );
    } else if (patientId) {
      setPatients((current) => [
        {
          id: patientId,
          name: values.name,
          phoneNumber: values.whatsapp,
          notes: values.notes || null,
          noShowCount: 0,
          isArchived: false,
          totalBalanceDue: 0,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
    }

    setEditingPatient(null);
  }

  function handleArchiveToggle(patient: PatientRecord) {
    const nextArchived = !patient.isArchived;
    setPendingId(patient.id);
    setPatients((current) =>
      current.map((item) =>
        item.id === patient.id ? { ...item, isArchived: nextArchived } : item,
      ),
    );

    startTransition(async () => {
      const result = nextArchived
        ? await archivePatient(patient.id)
        : await restorePatient(patient.id);

      if (!result.success) {
        setPatients((current) =>
          current.map((item) =>
            item.id === patient.id
              ? { ...item, isArchived: patient.isArchived }
              : item,
          ),
        );
      }

      setPendingId(null);
    });
  }

  function requestDeletePatient(patient: PatientRecord) {
    setDeletingPatient(patient);
  }

  function handleDeletePatient(patient: PatientRecord) {

    const snapshot = patients;
    setPendingId(patient.id);
    setPatients((current) =>
      current.filter((item) => item.id !== patient.id),
    );

    startTransition(async () => {
      const result = await deletePatient(patient.id);

      if (!result.success) {
        setPatients(snapshot);
      }

      setPendingId(null);
    });
  }

  function handleClearWarning(patient: PatientRecord) {
    if (patient.noShowCount === 0) return;

    setPendingId(patient.id);
    setPatients((current) =>
      current.map((item) =>
        item.id === patient.id ? { ...item, noShowCount: 0 } : item,
      ),
    );

    startTransition(async () => {
      const result = await clearPatientWarning(patient.id);

      if (!result.success) {
        setPatients((current) =>
          current.map((item) =>
            item.id === patient.id
              ? { ...item, noShowCount: patient.noShowCount }
              : item,
          ),
        );
      }

      setPendingId(null);
    });
  }

  const filters: { id: PatientFilter; label: string }[] = [
    { id: "active", label: t("filterActive") },
    { id: "warning", label: t("filterWarning") },
    { id: "archived", label: t("filterArchived") },
  ];

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-start">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
              <Users className="h-4 w-4 text-accent" aria-hidden />
            </div>
            <span className="text-xs font-medium uppercase tracking-widest text-muted">
              Nawa
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("addPatient")}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-subtle bg-surface py-2.5 ps-10 pe-4 text-sm text-primary outline-none transition focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                filter === item.id
                  ? "bg-accent/15 text-accent"
                  : "border border-subtle text-muted hover:text-primary",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle px-6 py-16 text-center">
          <p className="text-sm text-muted">{t("empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-subtle bg-surface">
          <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_auto] gap-4 border-b border-subtle px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted md:grid">
            <span>{t("colName")}</span>
            <span>{t("colPhone")}</span>
            <span>{t("colStatus")}</span>
            <span className="text-end">{t("colActions")}</span>
          </div>

          <ul className="divide-y divide-subtle">
            {filtered.map((patient, index) => (
              <motion.li
                key={patient.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="grid gap-4 px-6 py-5 md:grid-cols-[1.4fr_1fr_0.8fr_auto] md:items-center"
              >
                <div className="flex items-start gap-4 text-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base">
                    <UserRound className="h-5 w-5 text-accent" aria-hidden />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="text-base font-medium text-primary transition hover:text-accent"
                    >
                      {patient.name}
                    </Link>
                    {patient.notes && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted">
                        {patient.notes}
                      </p>
                    )}
                  </div>
                </div>

                <p className="flex items-center gap-1.5 text-sm text-muted">
                  {patient.phoneNumber}
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </p>

                <div>
                  {patient.isArchived ? (
                    <span className="rounded-full bg-muted/10 px-3 py-1 text-xs font-medium text-muted">
                      {t("archivedBadge")}
                    </span>
                  ) : patient.noShowCount === 1 ? (
                    <span className="rounded-full bg-accent-danger/10 px-3 py-1 text-xs font-medium text-accent-danger">
                      {t("warningBadge")}
                    </span>
                  ) : patient.noShowCount > 1 ? (
                    <span className="rounded-full bg-accent-danger/10 px-3 py-1 text-xs font-medium text-accent-danger">
                      {t("strikes", { count: patient.noShowCount })}
                    </span>
                  ) : (
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                      {t("activeBadge")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 md:justify-end">
                  {!patient.isArchived && patient.noShowCount > 0 && (
                    <button
                      type="button"
                      disabled={pendingId === patient.id}
                      onClick={() => handleClearWarning(patient)}
                      className="rounded-lg border border-subtle p-2 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                      aria-label={t("clearWarning")}
                    >
                      {pendingId === patient.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  {!patient.isArchived && (
                    <button
                      type="button"
                      onClick={() => openEdit(patient)}
                      className="rounded-lg border border-subtle p-2 text-muted transition hover:bg-elevated hover:text-primary"
                      aria-label={t("edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pendingId === patient.id}
                    onClick={() => handleArchiveToggle(patient)}
                    className="rounded-lg border border-subtle p-2 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                    aria-label={
                      patient.isArchived ? t("restore") : t("archive")
                    }
                  >
                    {pendingId === patient.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : patient.isArchived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={pendingId === patient.id}
                    onClick={() => requestDeletePatient(patient)}
                    className="rounded-lg border border-subtle p-2 text-muted transition hover:border-accent-danger/40 hover:bg-accent-danger/10 hover:text-accent-danger disabled:opacity-50"
                    aria-label={t("delete")}
                  >
                    {pendingId === patient.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      <PatientFormModal
        open={modalOpen}
        title={editingPatient ? t("editPatient") : t("addPatient")}
        patient={editingPatient}
        onClose={() => {
          setModalOpen(false);
          setEditingPatient(null);
        }}
        onSaved={handleSaved}
      />

      <AnimatePresence>
        {deletingPatient && (
          <>
            <motion.button
              type="button"
              aria-label={t("form.close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingPatient(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="fixed inset-x-4 top-[22%] z-[60] mx-auto w-full max-w-md rounded-2xl border border-subtle bg-surface p-5"
            >
              <h3 className="text-base font-semibold text-primary">{t("delete")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t("deleteConfirm", { name: deletingPatient.name })}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingPatient(null)}
                  className="flex-1 rounded-xl border border-subtle px-4 py-2 text-sm font-medium text-muted transition hover:bg-elevated hover:text-primary"
                >
                  {t("form.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePatient(deletingPatient)}
                  className="flex-1 rounded-xl bg-accent-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-danger/90"
                >
                  {t("delete")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
