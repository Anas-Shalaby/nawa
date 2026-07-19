import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

/** Floor is absorbed into Clinic OS Today. */
export default async function FloorRedirectPage() {
  const locale = await getLocale();
  redirect({ href: "/dashboard", locale });
}
