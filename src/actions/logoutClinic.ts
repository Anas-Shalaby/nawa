"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function logoutClinic() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
