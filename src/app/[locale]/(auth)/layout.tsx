import { Link } from "@/i18n/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-base">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 self-start">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <span className="text-sm font-bold text-accent">N</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-primary">Nawa</span>
        </Link>

        <div className="flex flex-1 items-center justify-center pb-10">{children}</div>
      </div>
    </div>
  );
}
