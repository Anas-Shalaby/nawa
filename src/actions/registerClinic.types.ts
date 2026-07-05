export type RegisterClinicErrorCode =
  | "EMAIL_IN_USE"
  | "WEAK_PASSWORD"
  | "INVALID_EMAIL"
  | "CLINIC_NAME_REQUIRED"
  | "TENANT_CREATE_FAILED"
  | "SIGN_IN_FAILED"
  | "UNKNOWN";

export interface RegisterClinicInput {
  clinicName: string;
  email: string;
  password: string;
  locale: string;
}

export interface RegisterClinicResult {
  success: boolean;
  errorCode?: RegisterClinicErrorCode;
  message?: string;
  redirectTo?: string;
}
