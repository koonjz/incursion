"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarPlus, FileCheck2, Files, LayoutDashboard, LogOut } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn, initials } from "@/lib/utils";
import { MOCK_EVENTS } from "@/lib/mock/events";

interface SidebarProps {
  onNavClick?: () => void;
  className?: string;
  /** Render without its own glass surface (used inside the mobile drawer). */
  bare?: boolean;
}

const PENDING = MOCK_EVENTS.filter((e) => e.status === "pending").length;

const NAV = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "My submissions", href: "/events/my-submissions", icon: Files },
  { title: "Submit event", href: "/events/new", icon: CalendarPlus },
  { title: "Review queue", href: "/verification", icon: FileCheck2, badge: PENDING },
];

export function Sidebar({ onNavClick, className, bare = false }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/events/new") return pathname === "/events/new";
    if (href === "/events/my-submissions") return pathname === "/events/my-submissions";
    if (href === "/verification") return pathname?.startsWith("/verification") ?? false;
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col justify-between p-4",
        !bare && "glass rounded-[var(--radius-hero)]",
        className
      )}
    >
      <div className="space-y-8">
        <div className="px-2 pt-2">
          <Logo href="/dashboard" onClick={onNavClick} />
        </div>

        <nav aria-label="App" className="space-y-1">
          {NAV.map(({ title, href, icon: Icon, badge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavClick}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
                  active
                    ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]"
                    : "text-body hover:bg-white/6 hover:text-ink"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className={cn("size-[18px]", active ? "text-white" : "text-blue-300")} />
                  {title}
                </span>
                {!!badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      active ? "bg-white/20 text-white" : "bg-blue-400/15 text-blue-100"
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2">
        <div className="glass-inset flex items-center gap-3 rounded-2xl p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-navy-900 text-sm font-semibold text-white">
            {initials("Rohan Varma")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Rohan Varma</p>
            <p className="truncate text-xs text-muted">ACM Core reviewer</p>
          </div>
        </div>
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/6 hover:text-ink"
        >
          <LogOut className="size-[18px]" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
