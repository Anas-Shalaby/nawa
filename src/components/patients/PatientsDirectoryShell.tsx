"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Eye,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserX,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { deletePatient, givePatientStrike } from "@/actions/managePatients";
import { matchesPatientSearch } from "@/lib/patients/search";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";
import type { PatientRecord } from "@/lib/queries/patients";
import { PatientFormModal, type PatientFormValues } from "./PatientFormModal";

const MENU_WIDTH = 176;
const MENU_ESTIMATED_HEIGHT = 200;
const VIEWPORT_GAP = 8;

interface PatientsDirectoryShellProps {
  patients: PatientRecord[];
}

type GridFilter = "all" | "debt" | "recent";

function formatVisitDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}

function hasRecentVisit(value: string | null | undefined): boolean {
  if (!value) return false;
  const days30 = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(value).getTime() <= days30;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function PatientsDirectoryShell({
  patients: initialPatients,
}: PatientsDirectoryShellProps) {
  const t = useTranslations("patients");
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<GridFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<PatientRecord | null>(null);
  const [strikePatient, setStrikePatient] = useState<PatientRecord | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    setPatients(initialPatients);
  }, [initialPatients]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current?.contains(event.target as Node)) return;
      setFilterOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim();
    return patients.filter((patient) => {
      if (!matchesPatientSearch({ name: patient.name, phoneNumber: patient.phoneNumber }, query)) {
        return false;
      }

      if (filter === "debt") return (patient.totalBalanceDue ?? 0) > 0;
      if (filter === "recent") return hasRecentVisit(patient.lastVisitAt);
      return true;
    });
  }, [patients, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length);

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
          totalVisits: 0,
          lastVisitAt: null,
        },
        ...current,
      ]);
    }

    setEditingPatient(null);
  }

  function requestDelete(patient: PatientRecord) {
    setDeletingPatient(patient);
  }

  function confirmDelete() {
    if (!deletingPatient) return;
    const patient = deletingPatient;
    setDeletingPatient(null);

    const snapshot = patients;
    setPendingId(patient.id);
    setPatients((current) => current.filter((item) => item.id !== patient.id));

    startTransition(async () => {
      const result = await deletePatient(patient.id);
      if (!result.success) setPatients(snapshot);
      setPendingId(null);
    });
  }

  function requestStrike(patient: PatientRecord) {
    setStrikePatient(patient);
  }

  function confirmStrike() {
    if (!strikePatient) return;
    const patient = strikePatient;
    const snapshot = patients;
    setStrikePatient(null);
    setPendingId(patient.id);
    setPatients((current) =>
      current.map((item) =>
        item.id === patient.id
          ? { ...item, noShowCount: item.noShowCount + 1 }
          : item,
      ),
    );

    startTransition(async () => {
      const result = await givePatientStrike(patient.id);

      if (!result.success) {
        setPatients(snapshot);
        toast.error(t("strikeError"), { description: result.error });
        setPendingId(null);
        return;
      }

      const count = result.newNoShowCount ?? patient.noShowCount + 1;
      setPatients((current) =>
        current.map((item) =>
          item.id === patient.id ? { ...item, noShowCount: count } : item,
        ),
      );
      toast.success(t("strikeSuccess"), {
        description: t("strikeSuccessHint", { name: patient.name, count }),
      });
      setPendingId(null);
    });
  }

  const rowsVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full" dir="rtl">
      <div className="sticky top-0 z-10 mb-4 bg-base/80 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-2xl">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              className="w-full rounded-xl border border-subtle bg-surface py-2.5 ps-10 pe-4 text-sm text-primary outline-none transition focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-2" ref={filterRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2 text-sm font-medium text-primary transition hover:bg-elevated"
              >
                <SlidersHorizontal className="h-4 w-4" />
                تصفية
              </button>
              {filterOpen && (
                <div className="absolute z-20 mt-2 w-56 rounded-xl border border-subtle bg-surface p-2 shadow-2xl shadow-black/25 ltr:left-0 rtl:right-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("all");
                      setFilterOpen(false);
                    }}
                    className={[
                      "w-full rounded-lg px-3 py-2 text-start text-sm transition",
                      filter === "all" ? "bg-accent/15 text-accent" : "text-primary hover:bg-elevated",
                    ].join(" ")}
                  >
                    كل المرضى
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("debt");
                      setFilterOpen(false);
                    }}
                    className={[
                      "mt-1 w-full rounded-lg px-3 py-2 text-start text-sm transition",
                      filter === "debt" ? "bg-accent/15 text-accent" : "text-primary hover:bg-elevated",
                    ].join(" ")}
                  >
                    عليهم مديونية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("recent");
                      setFilterOpen(false);
                    }}
                    className={[
                      "mt-1 w-full rounded-lg px-3 py-2 text-start text-sm transition",
                      filter === "recent"
                        ? "bg-accent/15 text-accent"
                        : "text-primary hover:bg-elevated",
                    ].join(" ")}
                  >
                    زار العيادة قريباً
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/20 transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              إضافة مريض جديد
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface/40 px-6 py-16 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="text-sm text-muted">لم يتم العثور على مرضى بهذا الاسم.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-subtle bg-surface">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] items-center gap-3 border-b border-subtle px-4 py-3 text-xs font-medium text-muted md:grid">
            <span className="text-start">المريض</span>
            <span className="text-center">آخر زيارة</span>
            <span className="text-center">إجمالي الزيارات</span>
            <span className="text-center">الحساب المتبقي</span>
            <span className="text-center">الإجراءات</span>
          </div>

          <motion.ul variants={rowsVariants} initial="hidden" animate="show" className="divide-y divide-subtle">
            {paged.map((patient) => {
              const due = patient.totalBalanceDue ?? 0;
              const visitCount = patient.totalVisits ?? 0;
              const whatsappUrl = buildWhatsAppActionUrl(patient.phoneNumber, "appointment", {
                patientName: patient.name,
                locale: "ar",
              });

              return (
                <motion.li
                  key={patient.id}
                  variants={rowVariants}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition hover:bg-elevated md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3 text-start">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-semibold text-accent">
                      {initials(patient.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-primary">{patient.name}</p>
                        {patient.noShowCount > 0 ? (
                          <span className="rounded-full bg-accent-danger/10 px-2 py-0.5 text-[11px] font-medium text-accent-danger">
                            {t("strikes", { count: patient.noShowCount })}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted" dir="ltr">
                        {patient.phoneNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted md:hidden">
                        {formatVisitDate(patient.lastVisitAt)}
                      </p>
                    </div>
                  </div>

                  <p className="hidden text-center text-sm text-muted md:block">
                    {formatVisitDate(patient.lastVisitAt)}
                  </p>

                  <div className="hidden justify-center md:flex">
                    <span className="inline-flex rounded-full border border-subtle bg-base/50 px-2.5 py-1 text-xs font-medium text-primary">
                      {visitCount}
                    </span>
                  </div>

                  <p
                    className={[
                      "text-center text-sm font-semibold",
                      due > 0 ? "text-accent-danger" : "text-status-completed",
                    ].join(" ")}
                  >
                    {due > 0 ? `${new Intl.NumberFormat("ar-EG").format(due)} ج.م` : "خالص"}
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-subtle px-3 py-2 text-xs font-medium text-primary transition hover:bg-elevated"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      عرض الملف
                    </Link>

                    <DirectoryActionsMenu
                      patient={patient}
                      whatsappUrl={whatsappUrl}
                      pending={pendingId === patient.id || isPending}
                      onEdit={() => openEdit(patient)}
                      onStrike={() => requestStrike(patient)}
                      onDelete={() => requestDelete(patient)}
                    />
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>

          {filtered.length > PAGE_SIZE && (
            <div className="flex flex-col gap-3 border-t border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                {t("pagination.showing", {
                  from: showingFrom,
                  to: showingTo,
                  total: filtered.length,
                })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-subtle px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5 rtl:hidden" aria-hidden />
                  <ChevronLeft className="hidden h-3.5 w-3.5 rtl:block" aria-hidden />
                  {t("pagination.previous")}
                </button>
                <span className="min-w-[7rem] text-center text-xs font-medium text-muted">
                  {t("pagination.page", { page, totalPages })}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-subtle px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("pagination.next")}
                  <ChevronLeft className="h-3.5 w-3.5 rtl:hidden" aria-hidden />
                  <ChevronRight className="hidden h-3.5 w-3.5 rtl:block" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <PatientFormModal
        open={modalOpen}
        title={editingPatient ? "تعديل المريض" : "إضافة مريض جديد"}
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
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-accent-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-danger/90"
                >
                  {t("delete")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {strikePatient && (
          <>
            <motion.button
              type="button"
              aria-label={t("form.close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStrikePatient(null)}
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
              <h3 className="text-base font-semibold text-primary">{t("strikeConfirmTitle")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t("strikeConfirmBody", { name: strikePatient.name })}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStrikePatient(null)}
                  className="flex-1 rounded-xl border border-subtle px-4 py-2 text-sm font-medium text-muted transition hover:bg-elevated hover:text-primary"
                >
                  {t("strikeCancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmStrike}
                  className="flex-1 rounded-xl bg-accent-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-danger/90"
                >
                  {t("strikeConfirm")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DirectoryActionsMenu({
  patient,
  whatsappUrl,
  pending,
  onEdit,
  onStrike,
  onDelete,
}: {
  patient: PatientRecord;
  whatsappUrl: string;
  pending: boolean;
  onEdit: () => void;
  onStrike: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("patients");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    openUpward: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward =
        spaceBelow < MENU_ESTIMATED_HEIGHT && rect.top > spaceBelow;

      let left = rect.right - MENU_WIDTH;
      left = Math.max(
        VIEWPORT_GAP,
        Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_GAP),
      );

      const top = openUpward
        ? Math.max(VIEWPORT_GAP, rect.top - VIEWPORT_GAP)
        : Math.min(rect.bottom + VIEWPORT_GAP, window.innerHeight - VIEWPORT_GAP);

      setPosition({ top, left, openUpward });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function runAndClose(action: () => void) {
    setOpen(false);
    action();
  }

  const menu =
    open && mounted && position
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            data-action-menu-root="true"
            style={{
              position: "fixed",
              top: position.openUpward ? undefined : position.top,
              bottom: position.openUpward
                ? window.innerHeight - position.top
                : undefined,
              left: position.left,
              width: MENU_WIDTH,
            }}
            className="z-[90] rounded-xl border border-subtle bg-surface p-1 shadow-2xl shadow-black/25"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-primary transition hover:bg-elevated"
            >
              <MessageCircle className="h-4 w-4 text-accent-success" />
              واتساب
            </a>
            <MenuButton
              icon={<Pencil className="h-4 w-4" />}
              label={t("edit")}
              onClick={() => runAndClose(onEdit)}
            />
            {!patient.isArchived && (
              <MenuButton
                icon={
                  pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )
                }
                label={t("giveStrike")}
                danger
                disabled={pending}
                onClick={() => runAndClose(onStrike)}
              />
            )}
            <MenuButton
              icon={
                pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )
              }
              label={t("delete")}
              danger
              disabled={pending}
              onClick={() => runAndClose(onDelete)}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-subtle p-2 text-muted transition hover:bg-elevated hover:text-primary"
        aria-label="خيارات سريعة"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <CircleEllipsis className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        "mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition disabled:opacity-50",
        danger
          ? "text-accent-danger hover:bg-accent-danger/10"
          : "text-primary hover:bg-elevated",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

