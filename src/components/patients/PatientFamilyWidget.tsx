"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { Link2, Loader2, Plus, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { createDependent } from "@/actions/managePatients";
import type { FamilyMember } from "@/lib/queries/patients";

const RELATIONSHIP_KEYS = ["child", "spouse", "parent", "sibling", "other"] as const;

interface PatientFamilyWidgetProps {
  patientId: string;
  parent: FamilyMember | null;
  dependents: FamilyMember[];
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PatientFamilyWidget({
  patientId,
  parent,
  dependents,
}: PatientFamilyWidgetProps) {
  const t = useTranslations("patients.family");
  const locale = useLocale();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function relationshipLabel(value: string | null): string | null {
    if (!value) return null;
    return RELATIONSHIP_KEYS.includes(value as (typeof RELATIONSHIP_KEYS)[number])
      ? t(`relationships.${value}`)
      : value;
  }

  const hasFamily = Boolean(parent) || dependents.length > 0;

  function resetForm() {
    setName("");
    setRelationshipType("");
    setFormError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    if (name.trim().length < 2 || !relationshipType) {
      setFormError(t("createError"));
      return;
    }

    startTransition(async () => {
      const result = await createDependent({
        parentId: patientId,
        name: name.trim(),
        relationshipType,
      });

      if (!result.success) {
        setFormError(result.error ?? t("createError"));
        toast.error(t("createError"), { description: result.error });
        return;
      }

      toast.success(t("createdSuccess"));
      setModalOpen(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <section className="mt-4 rounded-2xl border border-subtle bg-surface p-5" dir="rtl">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Users className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-sm font-semibold text-primary">{t("title")}</h2>
      </div>

      {parent ? (
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
            {t("masterAccount")}
          </p>
          <Link
            href={`/dashboard/patients/${parent.id}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-subtle bg-elevated/40 p-2 transition-colors hover:bg-elevated"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
                {getInitials(parent.name)}
              </span>
              <span className="truncate text-sm font-medium text-primary">
                {parent.name}
              </span>
            </span>
            <Link2 className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          </Link>
        </div>
      ) : null}

      {dependents.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
            {t("dependentsTitle")}
          </p>
          <ul className="space-y-1">
            {dependents.map((dependent) => (
              <li key={dependent.id}>
                <Link
                  href={`/dashboard/patients/${dependent.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-elevated"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
                      {getInitials(dependent.name)}
                    </span>
                    <span className="truncate text-sm font-medium text-primary">
                      {dependent.name}
                    </span>
                  </span>
                  {relationshipLabel(dependent.relationshipType) ? (
                    <span className="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
                      {relationshipLabel(dependent.relationshipType)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasFamily ? (
        <p className="rounded-lg border border-dashed border-subtle px-3 py-4 text-center text-xs text-muted">
          {t("empty")}
        </p>
      ) : null}

      {/* A dependent should not own its own dependents; hide add for dependents. */}
      {!parent ? (
        <button
          type="button"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-subtle px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t("addDependent")}
        </button>
      ) : null}

      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isPending && setModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-dependent-title"
              dir="rtl"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-subtle bg-surface p-6 shadow-2xl shadow-black/40"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3
                  id="add-dependent-title"
                  className="inline-flex items-center gap-2 text-lg font-semibold text-primary"
                >
                  <UserPlus className="h-5 w-5 text-accent" aria-hidden />
                  {t("addTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => !isPending && setModalOpen(false)}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
                  aria-label={t("cancel")}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="dependent-name"
                    className="mb-1.5 block text-sm font-medium text-primary"
                  >
                    {t("nameLabel")}
                  </label>
                  <input
                    id="dependent-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("namePlaceholder")}
                    autoComplete="off"
                    className="w-full rounded-xl border border-subtle bg-elevated px-4 py-3 text-base text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dependent-relationship"
                    className="mb-1.5 block text-sm font-medium text-primary"
                  >
                    {t("relationshipLabel")}
                  </label>
                  <select
                    id="dependent-relationship"
                    value={relationshipType}
                    onChange={(event) => setRelationshipType(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-subtle bg-elevated px-4 py-3 text-base text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">{t("relationshipPlaceholder")}</option>
                    {RELATIONSHIP_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`relationships.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {formError ? (
                  <p className="rounded-lg bg-accent-danger/10 px-3 py-2 text-sm text-accent-danger">
                    {formError}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => !isPending && setModalOpen(false)}
                    className="rounded-xl border border-subtle px-4 py-2 text-sm font-medium text-primary transition hover:bg-elevated"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <UserPlus className="h-4 w-4" aria-hidden />
                    )}
                    {isPending ? t("saving") : t("save")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
