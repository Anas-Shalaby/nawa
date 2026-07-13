import { getLocale } from "next-intl/server";
import { fetchInboxNotifications } from "@/actions/fetchInboxNotifications";
import { NotificationsInboxShell } from "@/components/dashboard/NotificationsInboxShell";

export default async function NotificationsPage() {
  const locale = await getLocale();
  const initialNotifications = await fetchInboxNotifications(locale);

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <NotificationsInboxShell initialNotifications={initialNotifications} />
    </div>
  );
}
