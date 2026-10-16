"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Menu,
  ShieldAlert,
  Sparkles,
  Building2,
  Workflow,
  Plus,
  HelpCircle,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { id: "events", label: "Events", icon: Sparkles },
  { id: "showcase", label: "Clash Radar", icon: ShieldAlert },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "venues", label: "Venues", icon: Building2 },
  { id: "workflow", label: "Workflow", icon: Workflow },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

export function SiteNav() {
  const [active, setActive] = useState("events");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -40% 0px", threshold: [0, 0.2, 0.5] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main navigation"
        className={cn(
          "glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 transition-all duration-300 sm:px-5",
          scrolled
            ? "border-white/14 bg-[#0a0d18]/95 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.85)] backdrop-blur-md"
            : "bg-[#0c1020]/80 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.5)]"
        )}
      >
        <Logo tagline={false} />

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200",
                active === id
                  ? "border border-blue-500/30 bg-blue-500/15 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icon className="size-3.5 text-blue-400" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right CTA actions */}
        <div className="flex items-center gap-2">
          {/* Radar operational pill */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Radar: Active</span>
          </div>

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/[0.1] hover:text-white"
          >
            Sign in
          </Link>

          {/* White primary button with dark text */}
          <Button asChild size="sm" className="h-9 px-3.5 text-xs font-semibold">
            <Link href="/login">
              <Plus className="size-3.5" />
              <span>Submit Event</span>
            </Link>
          </Button>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile navigation menu"
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-zinc-300 lg:hidden hover:text-white"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="glass-strong mx-auto mt-2 max-w-6xl rounded-2xl p-4 lg:hidden border border-white/12 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {LINKS.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={`#${id}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors",
                  active === id ? "bg-blue-500/20 text-white" : "text-zinc-300 hover:bg-white/5"
                )}
              >
                <Icon className="size-4 text-blue-400" />
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-xl border border-white/12 bg-white/5 py-2 text-xs font-semibold text-zinc-200"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center rounded-xl bg-white py-2 text-xs font-bold text-zinc-950"
            >
              Submit Event
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
