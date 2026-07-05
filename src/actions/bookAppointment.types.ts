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
  slotTime: string;
  name: string;
  whatsapp: string;
}

export interface BookAppointmentResult {
  success: boolean;
  appointmentId?: string;
  ticketToken?: string;
  errorCode?: BookingErrorCode;
  message?: string;
}
