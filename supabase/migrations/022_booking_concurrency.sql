-- =============================================================================
-- Nawa — Atomic public booking + tenant-scoped clinic branding
-- Migration: 022_booking_concurrency.sql
-- =============================================================================

BEGIN;

-- btree_gist supplies GiST equality operator classes for uuid and timestamptz.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Database-wide invariant (matches bookAppointment.ts slot check):
-- An "occupying" appointment is pending | confirmed | checked_in | in_session.
-- completed / canceled / no_show do NOT occupy the slot for new bookings.
--
-- Existing seed/demo data may already contain duplicate occupying rows for the
-- same (tenant_id, appointment_date). We keep the earliest row and soft-cancel
-- the rest so the exclusion constraint can be created without deleting history.
WITH ranked_collisions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, appointment_date
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.appointments
  WHERE status IN (
    'pending'::public.appointment_status,
    'confirmed'::public.appointment_status,
    'checked_in'::public.appointment_status,
    'in_session'::public.appointment_status
  )
)
UPDATE public.appointments AS a
SET status = 'canceled'::public.appointment_status
FROM ranked_collisions AS r
WHERE a.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_no_active_slot_collision'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_no_active_slot_collision
      EXCLUDE USING gist (
        tenant_id WITH =,
        appointment_date WITH =
      )
      WHERE (
        status IN (
          'pending'::public.appointment_status,
          'confirmed'::public.appointment_status,
          'checked_in'::public.appointment_status,
          'in_session'::public.appointment_status
        )
      );
  END IF;
END
$$;

COMMENT ON CONSTRAINT appointments_no_active_slot_collision
  ON public.appointments IS
  'Prevents concurrent occupying bookings for the same tenant and exact timestamp.';

CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
  p_tenant_id uuid,
  p_patient_id uuid,
  p_service_id uuid,
  p_appointment_date timestamptz,
  p_replaced_appointment_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_appointment_id uuid;
BEGIN
  IF p_tenant_id IS NULL
     OR p_patient_id IS NULL
     OR p_service_id IS NULL
     OR p_appointment_date IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '22004',
      MESSAGE = 'BOOKING_ARGUMENT_REQUIRED';
  END IF;

  -- The public Server Action invokes this RPC with the service-role client.
  -- Validate all tenant relationships inside the database; never trust RPC IDs.
  IF NOT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE id = p_tenant_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'CLINIC_UNAVAILABLE';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.patients
    WHERE id = p_patient_id
      AND tenant_id = p_tenant_id
      AND no_show_count < 2
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'PATIENT_UNAVAILABLE';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.services
    WHERE id = p_service_id
      AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'SERVICE_UNAVAILABLE';
  END IF;

  IF p_replaced_appointment_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.appointments
       WHERE id = p_replaced_appointment_id
         AND tenant_id = p_tenant_id
         AND status IN (
           'canceled'::public.appointment_status,
           'no_show'::public.appointment_status
         )
     ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_REPLACED_APPOINTMENT';
  END IF;

  -- PostgreSQL has no row to lock when a slot is still empty. A row-level
  -- SELECT ... FOR UPDATE therefore cannot serialize two first inserts.
  -- SHARE ROW EXCLUSIVE serializes booking writers that use this RPC. The GiST
  -- exclusion constraint above remains the final guarantee for every other
  -- insert path and makes one concurrent transaction wait, then fail.
  LOCK TABLE public.appointments IN SHARE ROW EXCLUSIVE MODE;

  IF EXISTS (
    SELECT 1
    FROM public.appointments
    WHERE tenant_id = p_tenant_id
      AND appointment_date = p_appointment_date
      AND status IN (
        'pending'::public.appointment_status,
        'confirmed'::public.appointment_status,
        'checked_in'::public.appointment_status,
        'in_session'::public.appointment_status
      )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'SLOT_UNAVAILABLE';
  END IF;

  INSERT INTO public.appointments (
    tenant_id,
    patient_id,
    service_id,
    appointment_date,
    status,
    replaced_appointment_id
  )
  VALUES (
    p_tenant_id,
    p_patient_id,
    p_service_id,
    p_appointment_date,
    'pending'::public.appointment_status,
    p_replaced_appointment_id
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
EXCEPTION
  WHEN exclusion_violation THEN
    -- A non-RPC writer may have won the race while this transaction waited.
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'SLOT_UNAVAILABLE';
END;
$$;

COMMENT ON FUNCTION public.book_appointment_atomic(
  uuid,
  uuid,
  uuid,
  timestamptz,
  uuid
) IS
  'Atomically inserts a pending appointment and raises SLOT_UNAVAILABLE on collision.';

REVOKE ALL ON FUNCTION public.book_appointment_atomic(
  uuid,
  uuid,
  uuid,
  timestamptz,
  uuid
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.book_appointment_atomic(
  uuid,
  uuid,
  uuid,
  timestamptz,
  uuid
) TO service_role;

-- ---------------------------------------------------------------------------
-- clinic-branding Storage RLS
-- Public reads are required by the patient booking page. Mutations are limited
-- to objects whose first path segment equals the JWT tenant_id:
--   <tenant_uuid>/<filename>
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS clinic_branding_public_read
  ON storage.objects;
DROP POLICY IF EXISTS clinic_branding_auth_upload
  ON storage.objects;
DROP POLICY IF EXISTS clinic_branding_auth_update
  ON storage.objects;
DROP POLICY IF EXISTS clinic_branding_auth_delete
  ON storage.objects;
DROP POLICY IF EXISTS clinic_branding_tenant_insert
  ON storage.objects;
DROP POLICY IF EXISTS clinic_branding_tenant_update
  ON storage.objects;
DROP POLICY IF EXISTS clinic_branding_tenant_delete
  ON storage.objects;

CREATE POLICY clinic_branding_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'clinic-branding');

CREATE POLICY clinic_branding_tenant_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clinic-branding'
    AND (storage.foldername(name))[1]
      = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

CREATE POLICY clinic_branding_tenant_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'clinic-branding'
    AND (storage.foldername(name))[1]
      = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
  WITH CHECK (
    bucket_id = 'clinic-branding'
    AND (storage.foldername(name))[1]
      = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

CREATE POLICY clinic_branding_tenant_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clinic-branding'
    AND (storage.foldername(name))[1]
      = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

COMMIT;
