"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Sparkles, UserRound } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { id: "events", label: "Events", icon: Sparkles },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function SiteNav() {
  const [active, setActive] = useState("events");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.2, 0.5] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className={cn(
          "glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-shadow duration-300 sm:px-5",
          scrolled && "shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]"
        )}
      >
        <Logo tagline={false} />

        <div className="flex items-center gap-1 sm:gap-1.5">
          {LINKS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4",
                active === id ? "bg-blue-400/15 text-white" : "text-muted hover:bg-white/6 hover:text-ink"
              )}
            >
              <Icon className="hidden size-4 sm:block" />
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 px-3 py-2 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[filter] duration-200 hover:brightness-110 sm:px-4"
          >
            <UserRound className="size-4" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sr-only sm:hidden">Profile</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
