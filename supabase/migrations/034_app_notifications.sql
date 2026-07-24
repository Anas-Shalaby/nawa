-- =============================================================================
-- Migration: 034_app_notifications.sql
-- Description: Robust notification system per clinic and user
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  action_href text,
  action_label_key text,
  meta jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_notifications IS 'Robust notification system per clinic and team member.';

CREATE INDEX idx_app_notifications_tenant_user_unread
  ON public.app_notifications USING btree (tenant_id, user_id, is_read);

-- RLS
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications FORCE ROW LEVEL SECURITY;

CREATE POLICY app_notifications_select_own
  ON public.app_notifications FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id() AND user_id = auth.uid());

CREATE POLICY app_notifications_update_own
  ON public.app_notifications FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id() AND user_id = auth.uid())
  WITH CHECK (tenant_id = public.get_tenant_id() AND user_id = auth.uid());

CREATE POLICY app_notifications_delete_own
  ON public.app_notifications FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id() AND user_id = auth.uid());


-- Function to clean up read notifications for current user
CREATE OR REPLACE FUNCTION public.cleanup_read_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  v_tenant_id := public.get_tenant_id();
  v_user_id := auth.uid();
  
  IF v_tenant_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    DELETE FROM public.app_notifications
    WHERE tenant_id = v_tenant_id
      AND user_id = v_user_id
      AND is_read = true;
  END IF;
END;
$$;

-- Trigger to notify on new appointment
CREATE OR REPLACE FUNCTION public.trg_notify_appointment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_name text;
  v_service_name text;
  v_staff record;
BEGIN
  -- Get patient name
  SELECT name INTO v_patient_name FROM public.patients WHERE id = NEW.patient_id;
  -- Get service name
  SELECT name INTO v_service_name FROM public.services WHERE id = NEW.service_id;

  FOR v_staff IN 
    SELECT user_id FROM public.staff_profiles 
    WHERE tenant_id = NEW.tenant_id AND user_id IS NOT NULL
  LOOP
    INSERT INTO public.app_notifications (
      tenant_id,
      user_id,
      kind,
      title,
      body,
      urgent,
      action_href,
      action_label_key,
      meta
    ) VALUES (
      NEW.tenant_id,
      v_staff.user_id,
      'booking',
      'booking_title',
      'booking_body',
      false,
      '/dashboard/patients/' || NEW.patient_id,
      'viewDetails',
      jsonb_build_object(
        'appointmentId', NEW.id,
        'patientId', NEW.patient_id,
        'patientName', v_patient_name,
        'serviceName', v_service_name,
        'appointmentDateIso', NEW.appointment_date
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_appointment_insert_notify
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_appointment_insert();
