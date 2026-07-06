-- Nawa — Ad-hoc time blocks (Time Exceptions Engine)
-- One-off unavailability on a specific date without changing weekly working_hours.

CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  block_date  date        NOT NULL,
  start_time  time        NOT NULL,
  end_time    time        NOT NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocked_slots_times_check CHECK (start_time < end_time)
);

COMMENT ON TABLE public.blocked_slots IS
  'Ad-hoc blocked intervals on specific dates (breaks, emergencies). Cairo-local times.';

CREATE INDEX IF NOT EXISTS idx_blocked_slots_tenant_date
  ON public.blocked_slots USING btree (tenant_id, block_date);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots FORCE ROW LEVEL SECURITY;

CREATE POLICY blocked_slots_select_tenant
  ON public.blocked_slots
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY blocked_slots_insert_tenant
  ON public.blocked_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY blocked_slots_update_tenant
  ON public.blocked_slots
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY blocked_slots_delete_tenant
  ON public.blocked_slots
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id());
