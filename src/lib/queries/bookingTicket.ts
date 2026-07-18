import {
  formatAppointmentDateLong,
  formatAppointmentTime,
} from "@/lib/datetime/cairo";
import { formatBookingReference } from "@/lib/booking/ticketToken";
import { createServiceRoleClient } from "@/utils/supabase/auth";

export interface BookingTicketView {
  appointmentId: string;
  bookingRef: string;
  patientName: string;
  clinicName: string;
  clinicSlug: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  status: string;
  /** Google Maps URL from doctor identity; null when no location is set. */
  mapsUrl: string | null;
}

function buildClinicMapsUrl(input: {
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}): string | null {
  const hasCoordinates =
    input.latitude !== null && input.longitude !== null;
  if (hasCoordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`;
  }

  const location = input.location?.trim();
  if (location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  }

  return null;
}

export async function fetchBookingTicketView(
  appointmentId: string,
  tenantSlug: string,
  locale: string,
): Promise<BookingTicketView | null> {
  const supabase = createServiceRoleClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, is_active, clinic_location, clinic_latitude, clinic_longitude",
    )
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (tenantError || !tenant || !tenant.is_active) {
    return null;
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select(
      `
      id,
      status,
      appointment_date,
      tenant_id,
      patients ( name ),
      services ( name )
    `,
    )
    .eq("id", appointmentId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return null;
  }

  const patient = Array.isArray(appointment.patients)
    ? appointment.patients[0]
    : appointment.patients;
  const service = Array.isArray(appointment.services)
    ? appointment.services[0]
    : appointment.services;

  if (!patient?.name || !service?.name) {
    return null;
  }

  return {
    appointmentId: appointment.id,
    bookingRef: formatBookingReference(appointment.id),
    patientName: patient.name,
    clinicName: tenant.name,
    clinicSlug: tenant.slug,
    serviceName: service.name,
    dateLabel: formatAppointmentDateLong(appointment.appointment_date, locale),
    timeLabel: formatAppointmentTime(appointment.appointment_date, locale),
    status: appointment.status,
    mapsUrl: buildClinicMapsUrl({
      location: tenant.clinic_location,
      latitude: tenant.clinic_latitude,
      longitude: tenant.clinic_longitude,
    }),
  };
}
