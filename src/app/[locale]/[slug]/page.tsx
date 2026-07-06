import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { NoServicesBooking } from "@/components/booking/NoServicesBooking";
import { fetchServicesPublic, fetchTenantBySlugPublic } from "@/lib/queries/publicBooking";

interface BookingPageProps {
  params: { locale: string; slug: string };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const tenant = await fetchTenantBySlugPublic(params.slug);

  if (!tenant) {
    notFound();
  }

  const services = await fetchServicesPublic(tenant.id);

  if (services.length === 0) {
    return <NoServicesBooking tenant={tenant} />;
  }

  return <BookingFlow tenant={tenant} services={services} />;
}

export async function generateMetadata({ params }: BookingPageProps) {
  const tenant = await fetchTenantBySlugPublic(params.slug);
  const t = await getTranslations({
    locale: params.locale,
    namespace: "metadata",
  });

  return {
    title: tenant ? `${t("bookingTitle")} — ${tenant.name}` : t("bookingTitle"),
    description: t("bookingDescription"),
  };
}
