import { fetchClinicSettings } from "@/lib/queries/settings";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export default async function SettingsPage() {
  const gate = await requirePagePermission("/dashboard/settings");
  if (!gate.allowed) return gate.ui;

  const settings = await fetchClinicSettings();

  return <SettingsShell settings={settings} />;
}
