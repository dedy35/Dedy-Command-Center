import { Search, Sparkles } from "lucide-react";

import { siteConfig } from "@/config/site";
import type { SessionUser } from "@/types/auth";

import { NavLink } from "./nav-link";

type AppShellProps = {
  children: React.ReactNode;
  user: SessionUser;
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-6 md:flex md:flex-col">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
              Personal OS
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">{siteConfig.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Production-ready workspace for your daily command center.
            </p>
          </div>

          <nav className="mt-8 space-y-1">
            {siteConfig.navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="mt-6 space-y-1">
            <p className="px-3 text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Admin
            </p>
            {siteConfig.adminNavItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>

          <div className="mt-auto space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-800">Signed In</p>
              <p className="mt-1 text-xs text-slate-600">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-100"
              >
                Sign out
              </button>
            </form>
            <p className="text-xs text-slate-500">
              External send/update/export actions stay approval-gated by design.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen w-full flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex w-full items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-tight">Dedy Command Center</p>
                <p className="text-xs text-slate-500">Authenticated Session</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/admin/audit-logs"
                  className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:inline-flex"
                >
                  Audit Logs
                </a>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  aria-label="Open command palette"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                    Ctrl+K
                  </span>
                </button>
              </div>
            </div>
          </header>

          <main className="w-full flex-1 px-4 py-5 pb-24 md:px-6 md:pb-6">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {siteConfig.navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} mobile />
          ))}
        </div>
      </nav>

      <button
        type="button"
        className="fixed right-4 bottom-20 z-30 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:hidden"
        aria-label="Quick capture"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    </div>
  );
}
