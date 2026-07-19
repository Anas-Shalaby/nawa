/** Shared prescription line / entity shapes used by UI + server. */

export type PrescriptionLineDraft = {
  id: string;
  medicineName: string;
  doseAmount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
  isChronic: boolean;
  isCustom: boolean;
};

export type PrescriptionLineInput = {
  medicineName: string;
  doseAmount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
  isChronic: boolean;
  isCustom: boolean;
};

export type PrescriptionRecord = {
  id: string;
  patientId: string;
  doctorName: string;
  clinicName: string;
  specialty: string;
  status: "active" | "void";
  generalNotes: string | null;
  publicToken: string;
  duplicatedFromId: string | null;
  createdAt: string;
  lines: PrescriptionLineRecord[];
};

export type PrescriptionLineRecord = {
  id: string;
  sortOrder: number;
  medicineName: string;
  doseAmount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
  isChronic: boolean;
  isCustom: boolean;
};

export type PrescriptionTemplateRecord = {
  id: string;
  name: string;
  createdAt: string;
  lines: PrescriptionLineInput[];
};

export type MedicineFavoriteRecord = {
  id: string;
  medicineName: string;
  doseAmount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
};

export type ChronicMedicationRecord = {
  id: string;
  medicineName: string;
  doseAmount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
};
