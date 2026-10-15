"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Radio,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCardStack } from "./EventCardStack";
import { LandingCalendar } from "./LandingCalendar";
import { EventQuickView } from "./EventQuickView";
import { SectionHead } from "./SectionHead";
import ParticleWave from "@/components/ParticleWave";
import type { CampusEvent } from "@/lib/types/event";

export interface HeroStat {
  value: number;
  label: string;
}

/**
 * Hero + calendar share one quick-view dialog, so they live in one client tree.
 * Features:
 * - Animated Particle-Wave background (3 flowing cyan/teal ribbons with hairline curves)
 * - Mobile-first, fully responsive hero layout with fluid typography and touch-friendly controls
 * - Wider event frame card deck with semantic Lucide icons and layered depth
 * - Preserved navigation, quick-view dialog, calendar, and statistics
 */
export function LandingExperience({
  events,
  stats,
  between,
  children,
}: {
  events: CampusEvent[];
  stats: HeroStat[];
  between?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState<CampusEvent | null>(null);

  return (
    <>
      <section
        id="events"
        className="relative isolate w-full overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24"
      >                    
        {/* Animated Particle-Wave Background canvas */}
        <ParticleWave />

        {/* Hero Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full min-w-0">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] xl:gap-14">
            {/* Left Column: Command Center Copy & Actions */}
            <div className="hero-rise w-full max-w-xl lg:max-w-none space-y-5 sm:space-y-6 lg:space-y-7 min-w-0">
              {/* System Status Pill */}
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-200 shadow-sm backdrop-blur-md">
                <span className="size-2 shrink-0 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="font-mono uppercase tracking-wider text-[10px] sm:text-[11px] font-semibold text-cyan-300 truncate">
                  ACM Resolve • Campus Conflict Radar Active
                </span>
              </div>

              {/* Fluid Headline */}
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[3.85rem] font-bold tracking-tight text-white leading-[1.12] sm:leading-[1.1] lg:leading-[1.08] break-words">
                Synchronize campus events.{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-200 bg-clip-text text-transparent">
                  Eliminate
                </span>{" "}
                scheduling clashes.
              </h1>

              {/* Supporting Description */}
              <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-zinc-300 font-normal">
                The high-precision scheduling engine for student chapters, department lecture halls, and faculty approvals. Catch venue overlaps and crowd conflicts before they happen.
              </p>

              {/* Calls to Action: Ordered, 44px min touch height, mobile-full width */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-1 w-full">
                {/* 1. Submit an Event (Primary, white background with dark text) */}
                <Button
                  asChild
                  size="lg"
                  className="h-11 sm:h-12 w-full sm:w-auto px-6 text-sm font-semibold bg-white text-zinc-950 hover:bg-cyan-100 hover:text-black focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-[0.98] transition-all shadow-sm"
                >
                  <Link href="/login">
                    <span>Submit an Event</span>
                    <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>

                {/* 2. Campus Calendar */}
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-11 sm:h-12 w-full sm:w-auto px-5 text-sm font-medium border border-white/10 bg-white/[0.05] hover:bg-white/[0.12] hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-[0.98] text-zinc-200 transition-all"
                >
                  <Link href="#calendar">
                    <Calendar className="size-4 mr-1.5 text-cyan-400" />
                    <span>Campus Calendar</span>
                  </Link>
                </Button>

                {/* 3. Simulate Clash */}
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-11 sm:h-12 w-full sm:w-auto px-4 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-cyan-400 active:scale-[0.98] transition-all"
                >
                  <Link href="#showcase">
                    <Zap className="size-4 mr-1.5 text-amber-400" />
                    <span>Simulate Clash</span>
                  </Link>
                </Button>
              </div>

              {/* Key Metrics Strip: Works at 320px with no horizontal overflow */}
              <dl className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-white/10 pt-5 sm:pt-6 w-full">
                {stats.map((s) => (
                  <div key={s.label} className="min-w-0 space-y-0.5 sm:space-y-1">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      {s.value}
                    </dd>
                    <p className="text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wide truncate">
                      {s.label}
                    </p>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right Column: Widescreen Event Frame Deck & Live Floating Diagnostics */}
            <div
              className="hero-rise relative flex flex-col items-center lg:items-end w-full min-w-0"
              style={{ "--delay": "140ms" } as React.CSSProperties}
            >
              {/* Live Diagnostic Chip: Conflict Status (2xl only to avoid mobile/tablet interference) */}
              <div
                aria-hidden
                className="glass pointer-events-none absolute -left-4 -top-5 z-30 hidden items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white shadow-xl 2xl:flex border border-emerald-500/25 bg-[#08121c]/90 backdrop-blur-md"
              >
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="leading-none text-emerald-300">Conflict Engine: Clear</p>
                  <p className="text-[10px] text-zinc-400 font-normal mt-0.5">0 venue double-bookings</p>
                </div>
              </div>

              {/* Live Diagnostic Chip: Venue Sync (2xl only) */}
              <div
                aria-hidden
                className="glass pointer-events-none absolute -right-3 -bottom-5 z-30 hidden items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white shadow-xl 2xl:flex border border-cyan-500/25 bg-[#08121c]/90 backdrop-blur-md"
              >
                <Radio className="size-4 text-cyan-400 shrink-0 animate-pulse" />
                <div>
                  <p className="leading-none text-cyan-200">6 Venues Linked</p>
                  <p className="text-[10px] text-zinc-400 font-normal mt-0.5">Live timetable sync</p>
                </div>
              </div>

              <EventCardStack events={events} onOpen={setOpen} />
            </div>
          </div>
        </div>
      </section>

      {between}

      <section id="calendar" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Live Schedule"
          title="Central campus events calendar"
          text="Explore confirmed events across every department and student society. Fully synchronized and verified."
        />
        <LandingCalendar events={events} onOpen={setOpen} />
      </section>

      {children}

      <EventQuickView event={open} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  );
}
