export interface Tenant {
  id: string;
  name: string;
  slug: string;
  /** Public clinic/reception phone. */
  whatsappNumber: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  type: "dental" | "dermatology";
  doctorName: string;
  specialty: string;
  bio: string;
  credentials: string[];
  avatarUrl: string | null;
  coverUrl: string | null;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceEgp: number | null;
  preVisitInstructions: string | null;
  isPackage: boolean;
  sessionsCount: number;
  colorCode: string | null;
}

export interface TimeSlot {
  id: string;
  time: string;
  label: string;
  available: boolean;
}

export type BookingStep = "services" | "slots" | "details";

export type BookingErrorCode = "SOFT_BANNED" | "SLOT_TAKEN" | "UNKNOWN";
