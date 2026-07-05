export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_session"
  | "completed"
  | "no_show"
  | "canceled";

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          slug?: string;
          is_active?: boolean;
        };
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          duration_minutes: number;
          price_egp: number | null;
          pre_visit_instructions: string | null;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          name: string;
          duration_minutes?: number;
          price_egp?: number | null;
          pre_visit_instructions?: string | null;
        };
        Update: {
          name?: string;
          duration_minutes?: number;
          price_egp?: number | null;
          pre_visit_instructions?: string | null;
        };
      };
      patients: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          phone_number: string;
          no_show_count: number;
          notes: string | null;
          is_archived: boolean;
          total_balance_due: number;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          name: string;
          phone_number: string;
          notes?: string | null;
          is_archived?: boolean;
          total_balance_due?: number;
        };
        Update: {
          name?: string;
          phone_number?: string;
          notes?: string | null;
          is_archived?: boolean;
          total_balance_due?: number;
        };
      };
      patient_payments: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          amount_paid: number;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          patient_id: string;
          amount_paid: number;
          paid_at?: string;
        };
        Update: {
          amount_paid?: number;
          paid_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          service_id: string;
          appointment_date: string;
          status: AppointmentStatus;
          replaced_appointment_id: string | null;
          doctor_notes: string | null;
          is_re_examination: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          patient_id: string;
          service_id: string;
          appointment_date: string;
          status?: AppointmentStatus;
          replaced_appointment_id?: string | null;
          doctor_notes?: string | null;
          is_re_examination?: boolean;
          created_at?: string;
        };
        Update: {
          status?: AppointmentStatus;
          replaced_appointment_id?: string | null;
          doctor_notes?: string | null;
          is_re_examination?: boolean;
        };
      };
      patient_media: {
        Row: {
          id: string;
          tenant_id: string;
          patient_id: string;
          file_path: string;
          tag: "before" | "after" | "x-ray" | "general";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          patient_id: string;
          file_path: string;
          tag?: "before" | "after" | "x-ray" | "general";
          notes?: string | null;
        };
        Update: {
          tag?: "before" | "after" | "x-ray" | "general";
          notes?: string | null;
        };
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      patient_media_tag: "before" | "after" | "x-ray" | "general";
    };
  };
}
