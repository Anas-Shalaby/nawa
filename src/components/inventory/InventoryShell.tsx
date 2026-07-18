"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Package,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { InventoryItem, InventoryOverview } from "@/lib/inventory/types";
import type { Locale } from "@/i18n/routing";
import { Can } from "@/components/auth/Can";
import { usePermission } from "@/components/auth/PermissionProvider";
import { InventoryItemCard } from "./InventoryItemCard";
import { InventoryItemModal } from "./InventoryItemModal";
import { InventoryRestockModal } from "./InventoryRestockModal";

interface InventoryShellProps {
  overview: InventoryOverview;
}

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function InventoryShell({ overview }: InventoryShellProps) {
  const t = useTranslations("inventory");
  const locale = useLocale() as Locale;
  const canManage = usePermission("inventory.manage");
  const [items, setItems] = useState(overview.items);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    setItems(overview.items);
  }, [overview.items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }, [items, search]);

  const kpis = useMemo(() => {
    const lowStockCount = items.filter(
      (item) => item.quantity <= item.minThreshold,
    ).length;
    const totalValueEgp = items.reduce(
      (sum, item) => sum + item.quantity * item.unitCostEgp,
      0,
    );
    return {
      totalItems: items.length,
      lowStockCount,
      totalValueEgp,
    };
  }, [items]);

  function openCreate() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function upsertLocal(item: InventoryItem) {
    setItems((current) => {
      const exists = current.some((row) => row.id === item.id);
      if (!exists) return [...current, item].sort((a, b) => a.name.localeCompare(b.name));
      return current
        .map((row) => (row.id === item.id ? item : row))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  return (
    <div className="w-full bg-base" dir="rtl">
      <div className="mb-8 text-start">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <Package className="h-4 w-4 text-accent" aria-hidden />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06 } },
        }}
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <motion.article
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle/70 bg-surface/70 p-5 backdrop-blur-sm"
        >
          <p className="text-sm text-muted">{t("kpiTotal")}</p>
          <p className="mt-3 text-3xl font-semibold text-primary">{kpis.totalItems}</p>
        </motion.article>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className={[
            "rounded-2xl border p-5 backdrop-blur-sm",
            kpis.lowStockCount > 0
              ? "border-accent-warning/40 bg-accent-warning/10 shadow-[0_0_28px_rgba(253,203,110,0.18)]"
              : "border-subtle/70 bg-surface/70",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">{t("kpiLow")}</p>
            <AlertTriangle
              className={[
                "h-4 w-4",
                kpis.lowStockCount > 0 ? "text-accent-warning" : "text-muted",
              ].join(" ")}
              aria-hidden
            />
          </div>
          <p
            className={[
              "mt-3 text-3xl font-semibold",
              kpis.lowStockCount > 0 ? "text-accent-warning" : "text-primary",
            ].join(" ")}
          >
            {kpis.lowStockCount}
          </p>
        </motion.article>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle/70 bg-surface/70 p-5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">{t("kpiValue")}</p>
            <Wallet className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold text-accent">
            {formatMoney(kpis.totalValueEgp, locale)}{" "}
            <span className="text-base font-medium text-muted">{t("currency")}</span>
          </p>
        </motion.article>
      </motion.div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-subtle bg-surface py-2.5 ps-9 pe-3 text-sm text-primary outline-none transition focus:border-accent"
          />
        </div>
        <Can permission="inventory.manage">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("addItem")}
          </button>
        </Can>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">
            {items.length === 0 ? t("empty") : t("emptySearch")}
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <InventoryItemCard
                item={item}
                onEdit={canManage ? () => openEdit(item) : undefined}
                onRestock={canManage ? () => setRestockItem(item) : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <InventoryItemModal
        open={formOpen}
        item={editingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSaved={(item) => {
          upsertLocal(item);
          setFormOpen(false);
          setEditingItem(null);
          toast.success(t("saved"));
        }}
      />

      <InventoryRestockModal
        open={Boolean(restockItem)}
        item={restockItem}
        onClose={() => setRestockItem(null)}
        onRestocked={(item) => {
          upsertLocal(item);
          setRestockItem(null);
          toast.success(t("restocked"));
        }}
      />
    </div>
  );
}
