"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { MOCK_EVENTS } from "@/lib/mock/events";

import { useAuth } from "@/lib/auth/auth-context";

const PENDING = MOCK_EVENTS.filter((e) => e.status === "pending").length;

function pageTitle(pathname: string | null): string {
  if (!pathname) return "ACM Resolve";
  if (pathname === "/dashboard") return "Overview";
  if (pathname === "/calendar") return "Calendar";
  if (pathname === "/events/new") return "Submit event";
  if (pathname === "/events/my-submissions") return "My submissions";
  if (pathname.endsWith("/conflicts")) return "Conflict details";
  if (pathname.endsWith("/edit")) return "Edit event";
  if (pathname.startsWith("/events/")) return "Event details";
  if (pathname.startsWith("/verification/")) return "Review event";
  if (pathname === "/verification") return "Review queue";
  if (pathname.startsWith("/expenses")) return "Expenses & Budgets";
  return "ACM Resolve";
}

export function Header() {
  const pathname = usePathname();
  const { isAcmCore } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(1);

  useEffect(() => {
    fetch("/api/events?status=PENDING")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setPendingCount(data.data.length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="glass flex h-16 shrink-0 items-center justify-between gap-3 rounded-2xl px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-3">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Main app navigation</SheetDescription>
              <Sidebar bare onNavClick={() => setOpen(false)} className="w-full p-1" />
            </SheetContent>
          </Sheet>
        </div>
        <h2 className="truncate text-base font-semibold text-ink sm:text-lg">{pageTitle(pathname)}</h2>
      </div>

      <div className="flex items-center gap-2">
        {isAcmCore && (
          <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Review queue, ${pendingCount} waiting`}>
            <Link href="/verification">
              <Bell />
              {pendingCount > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-blue-500 ring-2 ring-[#0b1330]" />
              )}
            </Link>
          </Button>
        )}
        {pathname !== "/events/new" && (
          <Button asChild>
            <Link href="/events/new">
              <Plus />
              <span className="hidden sm:inline">Submit event</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
