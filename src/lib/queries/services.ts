import type { Service } from "@/lib/booking/types";
import type { DashboardService } from "@/lib/dashboard/types";
import { mapServiceRow, SERVICE_SELECT } from "@/lib/services/mapService";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

function toDashboardService(service: Service): DashboardService {
  return {
    id: service.id,
    name: service.name,
    durationMinutes: service.durationMinutes,
    priceEgp: service.priceEgp,
    preVisitInstructions: service.preVisitInstructions,
  };
}

export async function fetchDashboardServices(): Promise<DashboardService[]> {
  const services = await fetchTenantServices();
  return services.map(toDashboardService);
}

export async function fetchTenantServices(): Promise<Service[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_SELECT)
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  return (data ?? []).map(mapServiceRow);
}

export async function fetchClinicBrief(): Promise<{
  clinicName: string;
  slug: string;
  tenantId: string;
  doctorName: string;
}> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const [{ data, error }, { data: authData }] = await Promise.all([
    supabase.from("tenants").select("name, slug").eq("id", tenantId).single(),
    supabase.auth.getUser(),
  ]);

  if (error) {
    throw new Error(`Failed to load clinic: ${error.message}`);
  }

  const user = authData.user;
  const meta = user?.user_metadata ?? {};
  const doctorName =
    (typeof meta.display_name === "string" && meta.display_name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    data.name;

  return {
    clinicName: data.name,
    slug: data.slug,
    tenantId,
    doctorName,
  };
}
