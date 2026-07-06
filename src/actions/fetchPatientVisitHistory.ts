"use server";

import { fetchPatientVisitHistory } from "@/lib/queries/patientVisits";

export async function getPatientVisitHistory(patientId: string) {
  return fetchPatientVisitHistory(patientId);
}
