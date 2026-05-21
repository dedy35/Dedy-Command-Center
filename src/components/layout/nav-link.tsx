"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
  mobile?: boolean;
};

export function NavLink({ href, label, mobile = false }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "transition-colors",
        mobile
          ? "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium"
          : "flex items-center rounded-xl px-3 py-2 text-sm font-medium",
        isActive
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {label}
    </Link>
  );
}
