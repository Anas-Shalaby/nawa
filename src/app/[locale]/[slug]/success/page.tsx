import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DigitalSuccessTicket } from "@/components/booking/DigitalSuccessTicket";
import { verifyBookingTicket } from "@/lib/booking/ticketToken";
import { fetchBookingTicketView } from "@/lib/queries/bookingTicket";

interface SuccessPageProps {
  params: { locale: string; slug: string };
  searchParams: { t?: string };
}

export async function generateMetadata({ params }: SuccessPageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: "booking.ticket" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function BookingSuccessPage({ params, searchParams }: SuccessPageProps) {
  const token = searchParams.t;

  if (!token) {
    notFound();
  }

  const verified = verifyBookingTicket(token);

  if (!verified || verified.slug !== params.slug) {
    notFound();
  }

  const ticket = await fetchBookingTicketView(
    verified.aid,
    params.slug,
    params.locale,
  );

  if (!ticket) {
    notFound();
  }

  const host = headers().get("x-forwarded-host") ?? headers().get("host");
  const protocol = headers().get("x-forwarded-proto") ?? "http";
  const verifyUrl = host
    ? `${protocol}://${host}/${params.locale}/${params.slug}/success?t=${encodeURIComponent(token)}`
    : `/${params.locale}/${params.slug}/success?t=${encodeURIComponent(token)}`;

  return (
    <DigitalSuccessTicket
      ticket={ticket}
      accessToken={token}
      verifyUrl={verifyUrl}
    />
  );
}
