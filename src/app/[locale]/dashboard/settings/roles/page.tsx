import { RolesSettingsShell } from "@/components/settings/RolesSettingsShell";
import { fetchClinicRoles } from "@/lib/auth/clinicRoles";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rolesSettings" });
  return { title: t("metaTitle") };
}

export default async function RolesSettingsPage() {
  const gate = await requirePagePermission("/dashboard/settings/roles");
  if (!gate.allowed) return gate.ui;

  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const roles = await fetchClinicRoles(supabase, tenantId);

  return <RolesSettingsShell initialRoles={roles} />;
}
