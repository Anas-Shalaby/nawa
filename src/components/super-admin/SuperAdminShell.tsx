import Link from "next/link";
import { LayoutDashboard, Building2 } from "lucide-react";

const NAV = [
  { href: "/super-admin", label: "لوحة الصحة", icon: LayoutDashboard },
  { href: "/super-admin/clinics", label: "إدارة العيادات", icon: Building2 },
] as const;

export function SuperAdminShell({
  children,
  activePath,
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  return (
    <div className="min-h-screen bg-[#050506] text-zinc-100">
      <div className="border-b border-zinc-800 bg-[#0a0a0c]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="text-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/80">
              Nawa · Super Admin
            </p>
            <h1 className="text-sm font-semibold text-zinc-100">لوحة مؤسس نواة</h1>
          </div>
          <Link
            href="/ar/dashboard"
            className="rounded border border-zinc-700 px-3 py-1.5 font-mono text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
          >
            خروج ← عيادة
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <nav className="flex shrink-0 gap-2 lg:w-52 lg:flex-col">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/super-admin"
                ? activePath === "/super-admin"
                : activePath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 text-start">{children}</main>
      </div>
    </div>
  );
}
