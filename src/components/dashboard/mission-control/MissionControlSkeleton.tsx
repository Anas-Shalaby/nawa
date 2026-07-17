export function MissionControlSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading mission control">
      <div className="h-16 animate-pulse rounded-2xl border border-subtle bg-surface" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
        <div className="h-[28rem] animate-pulse rounded-2xl border border-subtle bg-surface lg:col-span-3" />
        <div className="h-[32rem] animate-pulse rounded-2xl border border-subtle bg-surface lg:col-span-6" />
        <div className="h-[28rem] animate-pulse rounded-2xl border border-subtle bg-surface lg:col-span-3" />
      </div>
    </div>
  );
}
