import { AccountShell } from "@/components/account/AccountShell";
import { fetchAccountIdentity } from "@/lib/queries/accountIdentity";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accountSettings" });
  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function AccountPage() {
  const identity = await fetchAccountIdentity();
  return <AccountShell identity={identity} />;
}
