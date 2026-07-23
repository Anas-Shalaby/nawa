-- Adds the journey_state column to persist the Nawah Journey widget state

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS journey_state JSONB DEFAULT '{
  "phase": 1,
  "dismissed": false,
  "last_seen_at": null
}'::jsonb;

-- Optional index if we ever query by journey_state (e.g., finding tenants stuck in phase 1)
-- CREATE INDEX IF NOT EXISTS idx_tenants_journey_state ON tenants USING GIN (journey_state);
