import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { fetchSubscriptionPlans } from "@/lib/queries/subscriptionPlans";
import { isSubscriptionPlanId, type SubscriptionPlanId } from "@/lib/subscriptions/types";

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

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const plans = await fetchSubscriptionPlans();
  const planParam = searchParams.plan ?? "";
  const initialPlanId: SubscriptionPlanId | undefined = isSubscriptionPlanId(planParam)
    ? planParam
    : undefined;

  return <RegisterForm plans={plans} initialPlanId={initialPlanId} />;
}
