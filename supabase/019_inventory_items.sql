-- =============================================================================
-- Nawa — Clinic inventory / medical supplies
-- Migration: 019_inventory_items.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name                text        NOT NULL,
  category            text        NOT NULL DEFAULT 'عام',
  quantity            integer     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_threshold       integer     NOT NULL DEFAULT 1 CHECK (min_threshold >= 0),
  unit_cost_egp       integer     NOT NULL DEFAULT 0 CHECK (unit_cost_egp >= 0),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.inventory_items IS
  'Medical supplies and consumables tracked per clinic tenant.';

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_id
  ON public.inventory_items USING btree (tenant_id);

CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_name
  ON public.inventory_items USING btree (tenant_id, name);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items FORCE ROW LEVEL SECURITY;

CREATE POLICY inventory_items_select_tenant
  ON public.inventory_items
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY inventory_items_insert_tenant
  ON public.inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY inventory_items_update_tenant
  ON public.inventory_items
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY inventory_items_delete_tenant
  ON public.inventory_items
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id());
