"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Plus, Search, Stethoscope } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryByServiceId, setCategoryByServiceId] = useState<Record<string, string>>({});

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const modalTitle = useMemo(
    () => (editingService ? t("editService") : t("addService")),
    [editingService, t],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) => service.name.toLowerCase().includes(query));
  }, [services, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const service of filtered) {
      const category = categoryByServiceId[service.id] ?? "خدمات عامة";
      const bucket = map.get(category) ?? [];
      bucket.push(service);
      map.set(category, bucket);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [filtered, categoryByServiceId]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>(["خدمات عامة"]);
    for (const category of Object.values(categoryByServiceId)) categories.add(category);
    return Array.from(categories);
  }, [categoryByServiceId]);

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

  function handleSaved(values: ServiceFormValues) {
    if (editingService) {
      setCategoryByServiceId((current) => ({
        ...current,
        [editingService.id]: values.category || "خدمات عامة",
      }));
    }
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
          <h1 className="text-2xl font-semibold text-primary">الخدمات والأسعار</h1>
          <p className="mt-1 text-sm text-muted">إدارة خدمات العيادة، أوقاتها، وأسعارها</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن خدمة..."
              className="w-full rounded-xl border border-subtle bg-surface py-2.5 ps-9 pe-3 text-sm text-primary outline-none transition focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" aria-hidden />
            إضافة خدمة جديدة
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">لا توجد خدمات مطابقة لبحثك حاليًا.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="sticky top-0 z-10 mb-4 bg-base/90 py-1 text-lg font-bold text-primary backdrop-blur-sm">
                {group.category}
              </h2>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.05 } },
                }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {group.items.map((service) => (
                  <motion.div
                    key={service.id}
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                  >
                    <ServiceCard
                      service={service}
                      category={group.category}
                      deleting={deleteModalOpen && deletingService?.id === service.id}
                      onEdit={() => openEditModal(service)}
                      onDelete={() => openDeleteModal(service)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      )}

      <ServiceFormModal
        open={modalOpen}
        title={modalTitle}
        categoryOptions={categoryOptions}
        initialValues={
          editingService
            ? {
                name: editingService.name,
                category: categoryByServiceId[editingService.id] ?? "خدمات عامة",
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
