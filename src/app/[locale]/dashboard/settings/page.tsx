import { fetchClinicSettings } from "@/lib/queries/settings";
import { SettingsShell } from "@/components/settings/SettingsShell";

export default async function SettingsPage() {
  const settings = await fetchClinicSettings();

  return <SettingsShell settings={settings} />;
}
