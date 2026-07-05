import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export function isSuperAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;

  const role = user.app_metadata?.role as string | undefined;
  if (role === "super_admin") return true;

  const email = user.email?.toLowerCase();
  if (!email) return false;

  const single = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (single && email === single) return true;

  const list = process.env.SUPER_ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase());
  if (list?.includes(email)) return true;

  return false;
}

export async function getSuperAdminSession(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return isSuperAdminUser(user) ? user : null;
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await getSuperAdminSession();
  if (!user) {
    redirect("/");
  }
  return user;
}
