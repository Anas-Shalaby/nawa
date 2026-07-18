import { getTranslations } from "next-intl/server";
import { ServicesShell } from "@/components/services/ServicesShell";
import { fetchTenantServices } from "@/lib/queries/services";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "services" });

  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function ServicesPage() {
  const gate = await requirePagePermission("/dashboard/services");
  if (!gate.allowed) return gate.ui;

  const services = await fetchTenantServices();

  return <ServicesShell initialServices={services} />;
}
