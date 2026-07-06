"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Plus, Stethoscope } from "lucide-react";
import type { Service } from "@/lib/booking/types";
import { ServiceCard } from "./ServiceCard";
import { ServiceDeleteModal } from "./ServiceDeleteModal";
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
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const modalTitle = useMemo(
    () => (editingService ? t("editService") : t("addService")),
    [editingService, t],
  );

  function openCreateModal() {
    setEditingService(null);
    setModalOpen(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingService(null);
  }

  function openDeleteModal(service: Service) {
    setDeletingService(service);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setDeletingService(null);
  }

  function handleSaved() {
    closeModal();
    router.refresh();
  }

  function handleDeleted(serviceId: string) {
    setServices((current) => current.filter((service) => service.id !== serviceId));
    router.refresh();
  }

  return (
    <div className="w-full">
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

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle px-6 py-16 text-center">
          <p className="text-sm text-muted">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <ServiceCard
                service={service}
                deleting={deleteModalOpen && deletingService?.id === service.id}
                onEdit={() => openEditModal(service)}
                onDelete={() => openDeleteModal(service)}
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

      <ServiceDeleteModal
        open={deleteModalOpen}
        service={deletingService}
        onClose={closeDeleteModal}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
