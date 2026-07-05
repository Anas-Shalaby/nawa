import type { AuthError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "./server";
import { getMockTenantId, getSupabaseAnonKey, getSupabaseUrl } from "./config";

function formatAuthError(error: AuthError | null): string {
  if (!error) return "Unknown auth error";

  const parts = [
    error.message,
    error.status ? `status ${error.status}` : "",
    "code" in error && error.code ? String(error.code) : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(error);
}

/**
 * Returns tenant_id from JWT app_metadata, falling back to MOCK_TENANT_ID in dev.
 */
export async function resolveTenantId(
  supabase: SupabaseClient,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jwtTenantId = user?.app_metadata?.tenant_id as string | undefined;

  if (jwtTenantId) {
    return jwtTenantId;
  }

  const mockTenantId = getMockTenantId();
  if (mockTenantId) {
    return mockTenantId;
  }

  throw new Error(
    "Tenant context missing. Set MOCK_TENANT_ID or authenticate a staff user with app_metadata.tenant_id.",
  );
}

/**
 * Ensures an authenticated Supabase session for RLS-protected queries.
 * In development, signs in with SUPABASE_DEV_USER_EMAIL/PASSWORD when no session exists.
 */
export async function createAuthenticatedClient(): Promise<SupabaseClient> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return supabase;
  }

  const email = process.env.SUPABASE_DEV_USER_EMAIL;
  const password = process.env.SUPABASE_DEV_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "No Supabase session. Set SUPABASE_DEV_USER_EMAIL and SUPABASE_DEV_USER_PASSWORD, then run: node scripts/seed-dev-user.mjs",
    );
  }

  const anonKey = getSupabaseAnonKey();
  if (anonKey.startsWith("sb_publishable_")) {
    console.warn(
      "[Nawa] Using sb_publishable_ key — sign-in may fail. Set NEXT_PUBLIC_SUPABASE_ANON_KEY to the JWT anon key from Supabase → Settings → API.",
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(
      `Dev sign-in failed: ${formatAuthError(error)}. ` +
        "Run `node scripts/seed-dev-user.mjs` to recreate the staff user via the Admin API, " +
        "and set NEXT_PUBLIC_SUPABASE_ANON_KEY (JWT anon key, not sb_publishable_).",
    );
  }

  if (!data.session) {
    throw new Error("Dev sign-in returned no session.");
  }

  return supabase;
}

/** Server-only admin client for scripts — never import in client components. */
export function createServiceRoleClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
