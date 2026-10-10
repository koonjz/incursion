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
                  "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-sm transition-[background-color,color,box-shadow] duration-200 sm:aspect-[5/4]",
                  isSelected
                    ? "bg-blue-600 font-semibold text-white shadow-[0_8px_18px_-8px_rgba(37,99,235,0.5)]"
                    : list.length
                      ? "bg-white/[0.06] font-medium text-ink hover:bg-white/10"
                      : "text-body hover:bg-white/10",
                  isToday && !isSelected && "ring-2 ring-blue-400/50"
                )}
              >
                {day}
                <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                  {list.slice(0, 3).map((e) => (
                    <span key={e.id} className={cn("size-1.5 rounded-full", isSelected ? "bg-white" : "bg-blue-500")} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass flex flex-col rounded-[var(--radius-hero)] p-5 sm:p-7">
        <p className="text-sm text-muted">Selected day</p>
        <h3 className="font-display text-2xl font-medium text-ink">{formatLongDate(selected)}</h3>

        <div className="mt-5 flex-1 space-y-3" aria-live="polite">
          {dayEvents.length > 0 ? (
            dayEvents.map((e) => {
              const p = eventDateParts(e.date);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpen(e)}
                  className="group flex w-full cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left transition-[background-color,border-color,box-shadow] duration-200 hover:border-blue-400/40 hover:bg-white/10 hover:shadow-md"
                >
                  <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-blue-600 py-1.5 text-white">
                    <span className="text-[11px] text-white/70">{p.month}</span>
                    <span className="font-display text-xl leading-none">{p.day}</span>
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="block text-[15px] font-semibold leading-snug text-ink group-hover:text-blue-200">
                      {e.title}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <Clock className="size-3.5" />
                      {formatTime(e.startTime)} – {formatTime(e.endTime)}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="size-3.5" />
                      {e.venue}
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
