"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Loader2, Plus, Stethoscope } from "lucide-react";
import { deleteService } from "@/actions/manageServices";
import type { Service } from "@/lib/booking/types";
import { ServiceCard } from "./ServiceCard";
import { ServiceFormModal, type ServiceFormValues } from "./ServiceFormModal";

interface ServicesShellProps {
  initialServices: Service[];
}

export function ServicesShell({ initialServices }: ServicesShellProps) {
  const t = useTranslations("services");
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const modalTitle = useMemo(
    () => (editingService ? t("editService") : t("addService")),
    [editingService, t],
  );

  function openCreateModal() {
    setEditingService(null);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingService(null);
  }

  function handleSaved() {
    closeModal();
    router.refresh();
  }

  function handleDelete(serviceId: string) {
    setError(null);
    setDeletingId(serviceId);

    startTransition(async () => {
      const result = await deleteService(serviceId);

      if (!result.success) {
        setError(result.error ?? t("deleteError"));
        setDeletingId(null);
        return;
      }

      setServices((current) => current.filter((service) => service.id !== serviceId));
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-start">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
              <Stethoscope className="h-4 w-4 text-accent" aria-hidden />
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
          onClick={openCreateModal}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("addService")}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-accent-danger/20 bg-accent-danger/5 px-4 py-3 text-sm text-accent-danger">
          {error}
        </p>
      )}

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle px-6 py-16 text-center">
          <p className="text-sm text-muted">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <ServiceCard
                service={service}
                deleting={deletingId === service.id || isPending}
                onEdit={() => openEditModal(service)}
                onDelete={() => handleDelete(service.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <ServiceFormModal
        open={modalOpen}
        title={modalTitle}
        initialValues={
          editingService
            ? {
                name: editingService.name,
                durationMinutes: editingService.durationMinutes,
                priceEgp: editingService.priceEgp,
                preVisitInstructions: editingService.preVisitInstructions,
              }
            : undefined
        }
        serviceId={editingService?.id}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
