"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarPlus, FileCheck2, Files, LayoutDashboard, LogOut, WalletCards } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn, initials } from "@/lib/utils";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { useAuth } from "@/lib/auth/auth-context";

interface SidebarProps {
  onNavClick?: () => void;
  className?: string;
  /** Render without its own glass surface (used inside the mobile drawer). */
  bare?: boolean;
}

export function Sidebar({ onNavClick, className, bare = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAcmCore, logout } = useAuth();
  const [pendingBadge, setPendingBadge] = React.useState<number>(1);

  React.useEffect(() => {
    fetch("/api/events?status=PENDING")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setPendingBadge(data.data.length);
        }
      })
      .catch(() => {});
  }, []);

  const isOtherClub = user.role === "other_club_core";

  const navItems = isOtherClub
    ? [
        { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { title: "Calendar", href: "/calendar", icon: CalendarDays },
        { title: "Submit event", href: "/events/new", icon: CalendarPlus },
      ]
    : [
        { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { title: "Calendar", href: "/calendar", icon: CalendarDays },
        { title: "My submissions", href: "/events/my-submissions", icon: Files },
        { title: "Submit event", href: "/events/new", icon: CalendarPlus },
        ...(isAcmCore
          ? [
              { title: "Review queue", href: "/verification", icon: FileCheck2, badge: pendingBadge },
              { title: "Expenses & Budgets", href: "/expenses", icon: WalletCards },
            ]
          : []),
      ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/events/new") return pathname === "/events/new";
    if (href === "/events/my-submissions") return pathname === "/events/my-submissions";
    if (href === "/verification") return pathname?.startsWith("/verification") ?? false;
    if (href === "/expenses") return pathname?.startsWith("/expenses") ?? false;
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col justify-between p-4",
        !bare && "glass-strong rounded-[var(--radius-hero)] border border-white/10 bg-[#0a0d18]",
        className
      )}
    >
      <div className="space-y-8">
        <div className="px-2 pt-2">
          <Logo href="/dashboard" onClick={onNavClick} />
        </div>

        <nav aria-label="App" className="space-y-1">
          {navItems.map(({ title, href, icon: Icon, badge }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavClick}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "border border-blue-500/30 bg-blue-500/15 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className={cn("size-[18px]", active ? "text-blue-400" : "text-zinc-400")} />
                  {title}
                </span>
                {!!badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      active ? "bg-blue-500 text-white" : "bg-blue-400/15 text-blue-300"
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
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.name}
              className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-navy-900 text-sm font-semibold text-white">
              {initials(user?.name || "Campus User")}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.name || "Campus User"}</p>
            <p className="truncate text-xs text-muted">{user?.roleLabel || "Campus Member"}</p>
            {user?.department && (
              <p className="truncate text-[11px] text-blue-300/80 font-normal">{user.department}</p>
            )}
          </div>
        </div>
        <Link
          href="/login"
          onClick={() => {
            logout();
            onNavClick?.();
          }}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/6 hover:text-ink"
        >
          <LogOut className="size-[18px]" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
