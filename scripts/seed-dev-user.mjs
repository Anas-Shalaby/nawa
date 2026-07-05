/**
 * Creates the dev staff user via Supabase Auth Admin REST API.
 * Skips listUsers (often fails with "Database error finding users" on broken auth rows).
 *
 * Usage:
 *   1. Run supabase/003_fix_profiles_rls.sql in SQL Editor
 *   2. Run supabase/004_cleanup_dev_user.sql if a broken user exists
 *   3. node --env-file=.env scripts/seed-dev-user.mjs
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPABASE_DEV_USER_EMAIL ?? "secretary@clinic.example";
const password = process.env.SUPABASE_DEV_USER_PASSWORD ?? "NawaDev2026!";
const tenantId =
  process.env.MOCK_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (serviceRoleKey.startsWith("sb_")) {
  console.warn(
    "Warning: SUPABASE_SERVICE_ROLE_KEY looks like a publishable key. Use the JWT service_role key from Settings → API.",
  );
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

async function createUser() {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        provider: "email",
        providers: ["email"],
        tenant_id: tenantId,
      },
      user_metadata: {
        display_name: "Clinic Secretary",
      },
    }),
  });

  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

function printNextSteps() {
  console.log("\nNext steps:");
  console.log("1. Add JWT anon key to .env (NOT sb_publishable_):");
  console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY=<Settings → API → anon public>");
  console.log("2. Restart: npm run dev");
  console.log("3. Open: http://localhost:3000/ar/nova-dental");
}

try {
  console.log("Creating staff user (skipping listUsers)...");
  const { ok, status, body } = await createUser();

  if (ok) {
    console.log("Created staff user:", body.email ?? email);
    console.log("id:", body.id);
    console.log("tenant_id:", body.app_metadata?.tenant_id ?? tenantId);
    printNextSteps();
    process.exit(0);
  }

  const message = body.msg || body.message || body.error_code || JSON.stringify(body);

  if (
    status === 422 ||
    String(message).toLowerCase().includes("already") ||
    String(message).toLowerCase().includes("registered")
  ) {
    console.error("User already exists but may be broken.");
    console.error("\nRun in Supabase SQL Editor:");
    console.error("  supabase/004_cleanup_dev_user.sql");
    console.error("Then run this script again.");
    process.exit(1);
  }

  if (String(message).toLowerCase().includes("database error")) {
    console.error("Auth database error:", message);
    console.error("\nFix order:");
    console.error("  1. Run supabase/003_fix_profiles_rls.sql");
    console.error("  2. Run supabase/004_cleanup_dev_user.sql");
    console.error("  3. Create user in Dashboard → Authentication → Users (recommended)");
    console.error("     Email:", email, "| Password:", password, "| Auto-confirm ✓");
    console.error("  4. Run tenant_id SQL:");
    console.error(
      `     UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data,'{}'::jsonb) || '{"tenant_id":"${tenantId}"}'::jsonb WHERE email = '${email}';`,
    );
    console.error("\nOr retry: node --env-file=.env scripts/seed-dev-user.mjs");
    process.exit(1);
  }

  throw new Error(message);
} catch (error) {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
