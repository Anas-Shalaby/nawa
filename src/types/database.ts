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
          doctor_name: string | null;
          specialty: string | null;
          bio: string | null;
          credentials: string[] | unknown;
          avatar_url: string | null;
          cover_url: string | null;
        };
        Insert: {
          name: string;
          slug: string;
          is_active?: boolean;
          doctor_name?: string | null;
          specialty?: string | null;
          bio?: string | null;
          credentials?: string[] | unknown;
          avatar_url?: string | null;
          cover_url?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          is_active?: boolean;
          doctor_name?: string | null;
          specialty?: string | null;
          bio?: string | null;
          credentials?: string[] | unknown;
          avatar_url?: string | null;
          cover_url?: string | null;
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
      working_hours: {
        Row: {
          id: string;
          tenant_id: string;
          day_of_week: number;
          is_open: boolean;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          day_of_week: number;
          is_open?: boolean;
          start_time?: string | null;
          end_time?: string | null;
        };
        Update: {
          is_open?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          updated_at?: string;
        };
      };
      blocked_slots: {
        Row: {
          id: string;
          tenant_id: string;
          block_date: string;
          start_time: string;
          end_time: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          block_date: string;
          start_time: string;
          end_time: string;
          reason?: string | null;
        };
        Update: {
          block_date?: string;
          start_time?: string;
          end_time?: string;
          reason?: string | null;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          description_ar: string | null;
          description_en: string | null;
          duration_months: number;
          price_egp: number;
          setup_fee_egp: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name_ar: string;
          name_en: string;
          description_ar?: string | null;
          description_en?: string | null;
          duration_months: number;
          price_egp?: number;
          setup_fee_egp?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name_ar?: string;
          name_en?: string;
          description_ar?: string | null;
          description_en?: string | null;
          duration_months?: number;
          price_egp?: number;
          setup_fee_egp?: number;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      tenant_subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan_id: string;
          status: "trialing" | "active" | "expired" | "cancelled";
          starts_at: string;
          ends_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          plan_id: string;
          status?: "trialing" | "active" | "expired" | "cancelled";
          starts_at?: string;
          ends_at: string;
        };
        Update: {
          plan_id?: string;
          status?: "trialing" | "active" | "expired" | "cancelled";
          starts_at?: string;
          ends_at?: string;
        };
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      patient_media_tag: "before" | "after" | "x-ray" | "general";
      subscription_status: "trialing" | "active" | "expired" | "cancelled";
    };
  };
}
