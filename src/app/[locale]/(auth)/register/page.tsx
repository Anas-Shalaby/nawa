import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth.register" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
