"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowDown, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCardStack } from "./EventCardStack";
import { LandingCalendar } from "./LandingCalendar";
import { EventQuickView } from "./EventQuickView";
import { SectionHead } from "./SectionHead";
import type { CampusEvent } from "@/lib/types/event";

export interface HeroStat {
  value: number;
  label: string;
}

/**
 * Hero + calendar share one quick-view dialog, so they live in one client tree.
 * `between` renders after the hero, `children` after the calendar.
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
  const [liveEvents, setLiveEvents] = useState<CampusEvent[]>(events || []);

  const refreshEvents = React.useCallback(() => {
    fetch(`/api/events/campus?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setLiveEvents(data.data);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (events && events.length > 0) {
      setLiveEvents(events);
    }
  }, [events]);

  React.useEffect(() => {
    refreshEvents();

    const timer = setInterval(() => {
      refreshEvents();
    }, 3000);

    const onFocus = () => refreshEvents();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "acm_event_created") {
        refreshEvents();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshEvents]);

  return (
    <>
      <section id="events" className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6 sm:pt-40 lg:pb-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="hero-rise max-w-xl space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.06] px-3.5 py-1.5 text-sm text-body backdrop-blur">
              <Sparkles className="size-4 text-copper-400" />
              Fall term events are open
            </p>
            <h1 className="font-display text-[2.9rem] font-medium leading-[1.04] text-ink sm:text-6xl lg:text-[4.25rem]">
              Every campus event, on <span className="italic text-blue-300">one</span> calendar.
            </h1>
            <p className="text-lg leading-relaxed text-muted">
              See what is coming up, submit your own event, and catch scheduling clashes before they happen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">Sign in to submit an event</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#calendar">
                  Browse the calendar <ArrowDown />
                </Link>
              </Button>
            </div>

            <dl className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-4xl font-medium leading-none text-ink">{s.value}</dd>
                  <p className="mt-1.5 text-sm text-muted" aria-hidden>
                    {s.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>

          <div className="hero-rise relative" style={{ "--delay": "140ms" } as React.CSSProperties}>
            <div
              aria-hidden
              className="glass pointer-events-none absolute -left-4 top-10 z-30 hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm text-ink xl:flex"
            >
              <CheckCircle2 className="size-4 text-emerald-400" />
              No conflicts found
            </div>
            <div
              aria-hidden
              className="glass pointer-events-none absolute -right-2 bottom-24 z-30 hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm text-ink xl:flex"
            >
              <span className="size-2 rounded-full bg-copper-400" />
              {liveEvents.length} campus events
            </div>
            <EventCardStack events={liveEvents} onOpen={setOpen} />
          </div>
        </div>
      </section>

      {between}

      <section id="calendar" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHead
          eyebrow="Calendar"
          title="Campus calendar"
          text="Pick a day to see what is on campus."
        />
        <LandingCalendar events={liveEvents} onOpen={setOpen} />
      </section>

      {children}

      <EventQuickView event={open} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  );
}
