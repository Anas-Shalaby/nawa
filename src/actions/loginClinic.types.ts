export type LoginClinicInput = {
  email: string;
  password: string;
  locale: string;
};

export type LoginClinicErrorCode =
  | "INVALID_CREDENTIALS"
  | "INVALID_EMAIL"
  | "UNKNOWN";

export type LoginClinicResult =
  | { success: true; redirectTo: string }
  | { success: false; errorCode: LoginClinicErrorCode; message: string };
