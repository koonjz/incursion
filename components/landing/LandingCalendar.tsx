"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, eventDateParts, formatLongDate, formatTime, toDateKey } from "@/lib/utils";
import type { CampusEvent } from "@/lib/types/event";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Today's date is read on the client only, so server and client markup match.
const noopSubscribe = () => () => {};
const clientToday = () => {
  const d = new Date();
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
};
const serverToday = () => null;

export function LandingCalendar({
  events,
  onOpen,
}: {
  events: CampusEvent[];
  onOpen: (event: CampusEvent) => void;
}) {
  const firstDate = events[0]?.date ?? "2026-10-01";
  const [fy, fm] = firstDate.split("-").map(Number);

  const [view, setView] = useState({ year: fy, month: fm - 1 });
  const [selected, setSelected] = useState<string>(firstDate);
  const today = useSyncExternalStore(noopSubscribe, clientToday, serverToday);

  const byDate = useMemo(() => {
    const map = new Map<string, CampusEvent[]>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  const { year, month } = view;
  const leading = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1)
  );

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const goToday = () => {
    if (!today) return;
    const [ty, tm, td] = today.split("-").map(Number);
    setView({ year: ty, month: tm - 1 });
    setSelected(toDateKey(ty, tm - 1, td));
  };

  const dayEvents = byDate.get(selected) ?? [];
  const nextEventDate = events.find((e) => e.date > selected)?.date;

  const jumpTo = (date: string) => {
    const [y, m] = date.split("-").map(Number);
    setView({ year: y, month: m - 1 });
    setSelected(date);
  };

  const monthCount = events.filter((e) => e.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="glass rounded-[var(--radius-hero)] p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-medium text-ink sm:text-3xl" aria-live="polite">
              {monthLabel}
            </h3>
            <p className="text-sm text-muted">
              {monthCount} {monthCount === 1 ? "event" : "events"} this month
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday} disabled={!today}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="size-9" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" className="size-9" onClick={() => shift(1)} aria-label="Next month">
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={monthLabel}>
          {WEEKDAYS.map((d) => (
            <div key={d} role="columnheader" className="pb-2 text-center text-xs font-medium text-muted">
              {d}
            </div>
          ))}

          {Array.from({ length: leading }).map((_, i) => (
            <div key={`b${i}`} role="gridcell" aria-hidden />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = toDateKey(year, month, day);
            const list = byDate.get(key) ?? [];
            const isSelected = key === selected;
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${formatLongDate(key)}${list.length ? `, ${list.length} ${list.length === 1 ? "event" : "events"}` : ""}`}
                onClick={() => setSelected(key)}
                className={cn(
                  "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-sm transition-all duration-200 sm:aspect-[5/4]",
                  isSelected
                    ? "bg-white font-bold text-zinc-950 shadow-[0_4px_16px_rgba(255,255,255,0.25)]"
                    : list.length
                      ? "bg-white/[0.07] font-semibold text-white hover:bg-white/[0.12] border border-blue-500/20"
                      : "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
                  isToday && !isSelected && "ring-2 ring-blue-400"
                )}
              >
                {day}
                <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                  {list.slice(0, 3).map((e) => (
                    <span key={e.id} className={cn("size-1.5 rounded-full", isSelected ? "bg-zinc-950" : "bg-blue-400")} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass flex flex-col rounded-[var(--radius-hero)] p-5 sm:p-7 border border-white/10 bg-[#0c101d]">
        <div className="flex items-center justify-between border-b border-white/8 pb-3">
          <div>
            <p className="text-xs uppercase font-mono tracking-wider text-zinc-400">Selected Timetable</p>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">{formatLongDate(selected)}</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
            {dayEvents.length} {dayEvents.length === 1 ? "Booking" : "Bookings"}
          </span>
        </div>

        <div className="mt-4 flex-1 space-y-3" aria-live="polite">
          {dayEvents.length > 0 ? (
            dayEvents.map((e) => {
              const p = eventDateParts(e.date);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpen(e)}
                  className="group flex w-full cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition-all duration-200 hover:border-blue-400/50 hover:bg-white/[0.08] hover:shadow-lg"
                >
                  <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-blue-600/30 border border-blue-400/30 py-1.5 text-white">
                    <span className="text-[10px] font-mono uppercase text-blue-300">{p.month}</span>
                    <span className="font-display text-xl font-bold leading-none mt-0.5">{p.day}</span>
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-bold leading-snug text-white group-hover:text-blue-300 transition-colors">
                      {e.title}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="size-3.5 text-blue-400" />
                      <span>{formatTime(e.startTime)} – {formatTime(e.endTime)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <MapPin className="size-3.5 text-blue-400" />
                      <span className="font-medium">{e.venue}</span>
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <EmptyState
              icon={<CalendarDays />}
              title="Nothing scheduled"
              description="No approved events on this day."
              action={
                nextEventDate ? (
                  <Button variant="soft" size="sm" onClick={() => jumpTo(nextEventDate)}>
                    Jump to next event
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
