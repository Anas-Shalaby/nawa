import { redirect } from "next/navigation";

export default async function AgendaRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/upcoming`);
}
