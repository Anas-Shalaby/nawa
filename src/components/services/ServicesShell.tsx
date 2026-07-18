"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Can } from "@/components/auth/Can";
import { Package, Plus, Search, Stethoscope } from "lucide-react";
import type { Service } from "@/lib/booking/types";
import { ServiceCard } from "./ServiceCard";
import { ServiceDeleteModal } from "./ServiceDeleteModal";
import { ServiceFormModal, type ServiceFormValues } from "./ServiceFormModal";

type CatalogTab = "single" | "packages";

interface ServicesShellProps {
  initialServices: Service[];
}

export function ServicesShell({ initialServices }: ServicesShellProps) {
  const t = useTranslations("services");
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CatalogTab>("single");
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((service) => {
      const inTab =
        activeTab === "packages" ? service.isPackage : !service.isPackage;
      const matchesSearch =
        !query || service.name.toLowerCase().includes(query);
      return inTab && matchesSearch;
    });
  }, [activeTab, search, services]);

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

  function handleSaved(_values: ServiceFormValues) {
    closeModal();
    router.refresh();
  }

  function handleDeleted(serviceId: string) {
    setServices((current) => current.filter((service) => service.id !== serviceId));
    router.refresh();
  }

  return (
    <div className="w-full bg-base" dir="rtl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-start">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
              <Stethoscope className="h-4 w-4 text-accent" aria-hidden />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-primary">{t("catalogTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("catalogSubtitle")}</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-subtle bg-surface py-2.5 ps-9 pe-3 text-sm text-primary outline-none transition focus:border-accent"
            />
          </div>
          <Can permission="services.manage">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("addNew")}
            </button>
          </Can>
        </div>
      </div>

      <div className="mb-6 flex w-fit rounded-2xl border border-subtle bg-surface p-1">
        {(["single", "packages"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              activeTab === tab ? "text-accent" : "text-muted hover:text-primary",
            ].join(" ")}
          >
            {activeTab === tab ? (
              <motion.span
                layoutId="services-catalog-tab"
                className="absolute inset-0 rounded-xl bg-accent/15"
              />
            ) : null}
            {tab === "packages" ? (
              <Package className="relative h-4 w-4" aria-hidden />
            ) : (
              <Stethoscope className="relative h-4 w-4" aria-hidden />
            )}
            <span className="relative">
              {tab === "packages" ? t("packagesTab") : t("singleTab")}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">{t("catalogEmpty")}</p>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((service) => (
            <motion.div
              key={service.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <ServiceCard
                service={service}
                deleting={
                  deleteModalOpen && deletingService?.id === service.id
                }
                onEdit={() => openEditModal(service)}
                onDelete={() => openDeleteModal(service)}
              />
            </motion.div>
          ))}
        </motion.div>
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
                isPackage: editingService.isPackage,
                sessionsCount: editingService.sessionsCount,
                colorCode: editingService.colorCode,
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
