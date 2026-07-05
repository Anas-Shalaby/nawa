-- =============================================================================
-- Clean up broken dev staff user (run BEFORE recreating via Dashboard or script)
-- Use when auth returns "Database error finding users" or "querying schema"
-- =============================================================================

DELETE FROM public.profiles
WHERE id IN (SELECT id FROM auth.users WHERE email = 'secretary@clinic.example');

DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'secretary@clinic.example');

DELETE FROM auth.users
WHERE email = 'secretary@clinic.example';

-- Confirm cleanup
SELECT COUNT(*) AS remaining_users
FROM auth.users
WHERE email = 'secretary@clinic.example';
