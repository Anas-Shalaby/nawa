-- Nawa — Doctor weekly availability (Time Engine)
-- day_of_week: 0 = Sunday … 6 = Saturday (PostgreSQL EXTRACT(DOW))

CREATE TABLE IF NOT EXISTS public.working_hours (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  day_of_week  smallint    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open      boolean     NOT NULL DEFAULT false,
  start_time   time,
  end_time     time,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT working_hours_tenant_day_unique UNIQUE (tenant_id, day_of_week),
  CONSTRAINT working_hours_times_check CHECK (
    (is_open = false AND start_time IS NULL AND end_time IS NULL)
    OR (
      is_open = true
      AND start_time IS NOT NULL
      AND end_time IS NOT NULL
      AND start_time < end_time
    )
  )
);

COMMENT ON TABLE public.working_hours IS
  'Weekly clinic availability windows per tenant (Cairo-local times).';

CREATE INDEX IF NOT EXISTS idx_working_hours_tenant
  ON public.working_hours USING btree (tenant_id);

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours FORCE ROW LEVEL SECURITY;

CREATE POLICY working_hours_select_tenant
  ON public.working_hours
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY working_hours_insert_tenant
  ON public.working_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY working_hours_update_tenant
  ON public.working_hours
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY working_hours_delete_tenant
  ON public.working_hours
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- Seed sensible defaults for existing tenants (Sat closed, Sun–Thu 09:00–17:00, Fri 09:00–13:00)
INSERT INTO public.working_hours (tenant_id, day_of_week, is_open, start_time, end_time)
SELECT t.id, d.day_of_week, d.is_open, d.start_time::time, d.end_time::time
FROM public.tenants t
CROSS JOIN (
  VALUES
    (0, true,  '09:00', '17:00'),
    (1, true,  '09:00', '17:00'),
    (2, true,  '09:00', '17:00'),
    (3, true,  '09:00', '17:00'),
    (4, true,  '09:00', '17:00'),
    (5, true,  '09:00', '13:00'),
    (6, false, NULL,    NULL)
) AS d(day_of_week, is_open, start_time, end_time)
ON CONFLICT (tenant_id, day_of_week) DO NOTHING;
