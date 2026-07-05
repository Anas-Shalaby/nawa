import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth.login" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function LoginPage() {
  return <LoginForm />;
}
