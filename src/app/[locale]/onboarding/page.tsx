import { redirect } from "next/navigation";

export default function OnboardingRedirectPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // The onboarding flow has been migrated to the Journey Widget inside the dashboard.
  // Redirecting any legacy links to the dashboard.
  redirect(`/${locale}/dashboard`);
}
