import type { BookingErrorCode } from "@/lib/booking/types";

export class BookingActionError extends Error {
  constructor(
    public code: BookingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BookingActionError";
  }
}

export interface BookAppointmentInput {
  tenantSlug: string;
  serviceId: string;
  date: string;
  slotTime: string;
  name: string;
  whatsapp: string;
  bookingType: "self" | "dependent";
  dependentName?: string;
  relationshipType?: "child" | "spouse" | "parent" | "other";
}

export interface BookAppointmentResult {
  success: boolean;
  appointmentId?: string;
  ticketToken?: string;
  errorCode?: BookingErrorCode;
  message?: string;
}
