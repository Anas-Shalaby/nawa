import { ClinicsTable } from "@/components/super-admin/ClinicsTable";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { fetchSuperAdminClinics } from "@/lib/super-admin/clinics";

export const metadata = {
  title: "إدارة العيادات — Super Admin",
  robots: { index: false, follow: false },
};

export default async function SuperAdminClinicsPage() {
  const clinics = await fetchSuperAdminClinics();

  return (
    <SuperAdminShell activePath="/super-admin/clinics">
      <div className="space-y-6">
        <header>
          <h2 className="text-xl font-semibold text-zinc-50">CRM العيادات</h2>
          <p className="mt-1 text-sm text-zinc-500">
            بيانات وصفية فقط — بدون أسماء مرضى أو أرقام هواتف
          </p>
        </header>
        <ClinicsTable clinics={clinics} />
      </div>
    </SuperAdminShell>
  );
}
