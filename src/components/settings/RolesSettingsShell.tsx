"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Copy,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createCustomRole,
  deleteCustomRole,
  duplicateClinicRole,
  resetRoleToDefaults,
  saveRolePermissions,
} from "@/actions/manageRoles";
import type { ClinicRoleView } from "@/lib/auth/clinicRoles";
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_MODULES,
  type Permission,
  type PermissionModule,
} from "@/lib/auth/permissions";
import { EntityContextHeader } from "@/components/settings/EntityContextHeader";
import { Link } from "@/i18n/navigation";

interface RolesSettingsShellProps {
  initialRoles: ClinicRoleView[];
}

export function RolesSettingsShell({ initialRoles }: RolesSettingsShellProps) {
  const t = useTranslations("rolesSettings");
  const [roles, setRoles] = useState(initialRoles);
  const [selectedKey, setSelectedKey] = useState(initialRoles[0]?.key ?? "owner");
  const [draft, setDraft] = useState<Set<Permission>>(
    () => new Set(initialRoles[0]?.permissions ?? []),
  );
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<PermissionModule>>(
    () => new Set(PERMISSION_MODULES),
  );
  const [newRoleName, setNewRoleName] = useState("");
  const [isPending, startTransition] = useTransition();

  const selected = roles.find((role) => role.key === selectedKey) ?? roles[0];

  function roleDisplayName(role: ClinicRoleView): string {
    if (role.isSystem) {
      const key = `roleNames.${role.key}` as const;
      return t.has(key) ? t(key) : role.label;
    }
    return role.label;
  }

  function permissionLabel(permission: Permission): string {
    return t(`permissions.${permission}`);
  }

  function selectRole(role: ClinicRoleView) {
    setSelectedKey(role.key);
    setDraft(new Set(role.permissions));
  }

  function togglePermission(permission: Permission) {
    setDraft((current) => {
      const next = new Set(current);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  function setModuleAll(module: PermissionModule, enabled: boolean) {
    const keys = PERMISSION_DEFINITIONS.filter((d) => d.module === module).map(
      (d) => d.key,
    );
    setDraft((current) => {
      const next = new Set(current);
      for (const key of keys) {
        if (enabled) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return PERMISSION_MODULES.map((module) => {
      const items = PERMISSION_DEFINITIONS.filter((d) => d.module === module).filter(
        (d) => {
          if (!query) return true;
          const label = t(`permissions.${d.key}`).toLowerCase();
          const moduleLabel = t(`modules.${module}`).toLowerCase();
          return (
            label.includes(query) ||
            moduleLabel.includes(query) ||
            d.key.toLowerCase().includes(query)
          );
        },
      );
      return { module, items };
    }).filter((group) => group.items.length > 0);
  }, [search, t]);

  function handleSave() {
    if (!selected) return;
    startTransition(async () => {
      const result = await saveRolePermissions({
        roleKey: selected.key,
        roleId: selected.id,
        label: selected.label,
        permissions: Array.from(draft),
      });
      if (!result.success) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      if (result.roles) {
        setRoles(result.roles);
        const refreshed = result.roles.find((role) => role.key === selected.key);
        if (refreshed) setDraft(new Set(refreshed.permissions));
      }
      toast.success(t("saved"));
    });
  }

  function handleReset() {
    if (!selected) return;
    startTransition(async () => {
      const result = await resetRoleToDefaults({
        roleKey: selected.key,
        roleId: selected.id,
      });
      if (!result.success) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      if (result.roles) {
        setRoles(result.roles);
        const refreshed = result.roles.find((role) => role.key === selected.key);
        if (refreshed) {
          setSelectedKey(refreshed.key);
          setDraft(new Set(refreshed.permissions));
        }
      }
      toast.success(t("saved"));
    });
  }

  function handleCreate() {
    const label = newRoleName.trim();
    if (!label) return;
    startTransition(async () => {
      const result = await createCustomRole({
        label,
        basedOn: selected?.key ?? "receptionist",
        permissions: Array.from(draft),
      });
      if (!result.success || !result.role) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      setRoles((current) => [...current, result.role!]);
      selectRole(result.role);
      setNewRoleName("");
      toast.success(t("saved"));
    });
  }

  function handleDuplicate() {
    if (!selected) return;
    startTransition(async () => {
      const result = await duplicateClinicRole({
        sourceKey: selected.key,
        sourceId: selected.id,
        label: t("duplicateCopySuffix", { name: roleDisplayName(selected) }),
      });
      if (!result.success || !result.role) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      setRoles((current) => [...current, result.role!]);
      selectRole(result.role);
      toast.success(t("saved"));
    });
  }

  function handleDelete() {
    if (!selected?.id || selected.isSystem) return;
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteCustomRole(selected.id!);
      if (!result.success) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      if (result.roles) {
        setRoles(result.roles);
        const next = result.roles[0];
        if (next) selectRole(next);
      }
      toast.success(t("saved"));
    });
  }

  if (!selected) {
    return <p className="text-sm text-muted">{t("noPermission")}</p>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link
          href="/dashboard/settings"
          className="text-sm text-muted transition hover:text-primary"
        >
          ← {t("backToSettings")}
        </Link>
      </div>

      <EntityContextHeader
        entityLabel={t("entityLabel")}
        title={t("title")}
        subtitle={t("subtitle")}
        icon={Shield}
      />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("rolesTitle")}
          </p>
          <ul className="space-y-1 rounded-2xl border border-subtle bg-surface p-2">
            {roles.map((role) => (
              <li key={role.key}>
                <button
                  type="button"
                  onClick={() => selectRole(role)}
                  className={[
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm transition",
                    role.key === selected.key
                      ? "bg-accent/15 text-accent"
                      : "text-primary hover:bg-elevated",
                  ].join(" ")}
                >
                  <span className="font-medium">{roleDisplayName(role)}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted">
                    {role.isSystem ? t("systemBadge") : t("customBadge")}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-subtle bg-surface p-3">
            <label className="mb-2 block text-xs font-medium text-muted">
              {t("newRoleName")}
            </label>
            <input
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
              className="mb-2 w-full rounded-xl border border-subtle bg-base px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending || newRoleName.trim().length < 2}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-subtle px-3 py-2 text-sm font-medium text-primary transition hover:border-accent/40 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("createCustom")}
            </button>
          </div>
        </aside>

        <section className="rounded-2xl border border-subtle bg-surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-primary">
                {roleDisplayName(selected)}
              </h2>
              <p className="text-xs text-muted">{t("matrixTitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-primary transition hover:bg-elevated disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                {t("duplicate")}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-primary transition hover:bg-elevated disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                {t("resetDefaults")}
              </button>
              {!selected.isSystem ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-accent-danger/30 px-3 py-2 text-xs font-medium text-accent-danger transition hover:bg-accent-danger/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {t("deleteCustom")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden />
                )}
                {isPending ? t("saving") : t("save")}
              </button>
            </div>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="mb-4 w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary outline-none focus:border-accent"
          />

          <div className="space-y-3">
            {filteredModules.map(({ module, items }) => {
              const open = expanded.has(module);
              const enabledCount = items.filter((item) => draft.has(item.key)).length;
              return (
                <div
                  key={module}
                  className="overflow-hidden rounded-xl border border-subtle bg-base/40"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((current) => {
                          const next = new Set(current);
                          if (next.has(module)) next.delete(module);
                          else next.add(module);
                          return next;
                        })
                      }
                      className="inline-flex flex-1 items-center gap-2 text-start text-sm font-semibold text-primary"
                    >
                      <ChevronDown
                        className={[
                          "h-4 w-4 text-muted transition",
                          open ? "" : "-rotate-90",
                        ].join(" ")}
                      />
                      {t(`modules.${module}`)}
                      <span className="text-xs font-normal text-muted">
                        {enabledCount}/{items.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModuleAll(module, true)}
                      className="rounded-lg px-2 py-1 text-[11px] text-muted transition hover:bg-elevated hover:text-primary"
                    >
                      {t("selectAll")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModuleAll(module, false)}
                      className="rounded-lg px-2 py-1 text-[11px] text-muted transition hover:bg-elevated hover:text-primary"
                    >
                      {t("clearModule")}
                    </button>
                  </div>
                  {open ? (
                    <ul className="divide-y divide-subtle/70">
                      {items.map((item) => (
                        <li key={item.key}>
                          <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition hover:bg-elevated/60">
                            <input
                              type="checkbox"
                              checked={draft.has(item.key)}
                              onChange={() => togglePermission(item.key)}
                              className="h-4 w-4 rounded border-subtle accent-[var(--color-accent,#0d9488)]"
                            />
                            <span className="text-primary">
                              {permissionLabel(item.key)}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
