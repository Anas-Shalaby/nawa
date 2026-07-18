import { FinancialsShell } from "@/components/financials/FinancialsShell";
import { fetchFinancialOverview } from "@/lib/queries/financials";
import { fetchClinicBrief } from "@/lib/queries/services";
import { getTranslations } from "next-intl/server";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "financials" });
  return { title: t("metaTitle") };
}

export default async function FinancialsPage() {
  const gate = await requirePagePermission("/dashboard/financials");
  if (!gate.allowed) return gate.ui;

  const [overview, clinic] = await Promise.all([
    fetchFinancialOverview(),
    fetchClinicBrief(),
  ]);

  return (
    <FinancialsShell
      overview={overview}
      clinicName={clinic.clinicName}
      doctorName={clinic.doctorName}
    />
  );
}
