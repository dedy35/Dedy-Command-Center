export const siteConfig = {
  name: "Dedy Command Center",
  description:
    "Personal command center for focused execution, designed for private and production-grade daily use.",
  navItems: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Capture", href: "/capture" },
    { label: "Money", href: "/money" },
    { label: "Work", href: "/work" },
    { label: "More", href: "/more" },
  ],
  adminNavItems: [{ label: "Audit Logs", href: "/admin/audit-logs" }],
} as const;

export type NavItem = (typeof siteConfig.navItems)[number];
export type AdminNavItem = (typeof siteConfig.adminNavItems)[number];
