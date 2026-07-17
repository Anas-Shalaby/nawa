import { MissionControlShell } from "@/components/dashboard/mission-control/MissionControlShell";
import { fetchMissionControlSnapshot } from "@/lib/queries/missionControlSnapshot";

export default async function DashboardPage() {
  const snapshot = await fetchMissionControlSnapshot();

  return (
    <div className="flex h-full w-full max-w-none flex-col">
      <MissionControlShell {...snapshot} />
    </div>
  );
}
