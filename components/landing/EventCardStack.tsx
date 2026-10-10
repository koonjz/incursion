"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, eventDateParts, formatTime } from "@/lib/utils";
import type { CampusEvent } from "@/lib/types/event";

const BANNERS = [
  "from-blue-600 to-navy-950",
  "from-blue-600 to-navy-900",
  "from-blue-700 to-navy-950",
  "from-blue-500 to-blue-800",
  "from-blue-600 to-navy-900",
];

// Resting pose for each depth in the stack (0 = top card).
const DEPTH = [
  { y: 0, s: 1, r: 0, o: 1 },
  { y: 20, s: 0.95, r: -2.4, o: 1 },
  { y: 38, s: 0.9, r: 2.6, o: 0.92 },
  { y: 54, s: 0.85, r: -1.6, o: 0.75 },
];
const FLY_MS = 360;
const SWIPE_DISTANCE = 90;

type Leaving = { idx: number; dir: 1 | -1 };
type Entering = { idx: number; go: boolean };

export function EventCardStack({
  events,
  onOpen,
}: {
  events: CampusEvent[];
  onOpen: (event: CampusEvent) => void;
}) {
  const n = events.length;
  const visible = Math.min(DEPTH.length, n);

  const [active, setActive] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const [entering, setEntering] = useState<Entering | null>(null);
  const [recycled, setRecycled] = useState<number | null>(null);

  const busy = leaving !== null || entering !== null;
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const nextFrame = useCallback((fn: () => void) => {
    // Two frames guarantee the previous style was actually painted.
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }, []);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(window.clearTimeout);
  }, []);

  const goNext = useCallback(
    (dir: 1 | -1 = 1) => {
      if (busy || n < 2) return;
      const idx = active;
      setLeaving({ idx, dir });
      setActive((active + 1) % n);
      later(() => {
        setLeaving(null);
        setRecycled(idx);
        nextFrame(() => setRecycled(null));
      }, FLY_MS);
    },
    [active, busy, later, n, nextFrame]
  );

  const goPrev = useCallback(() => {
    if (busy || n < 2) return;
    const idx = (active - 1 + n) % n;
    setActive(idx);
    setEntering({ idx, go: false });
    nextFrame(() => setEntering({ idx, go: true }));
    later(() => setEntering(null), 520);
  }, [active, busy, later, n, nextFrame]);

  const jumpTo = (target: number) => {
    if (busy || target === active) return;
    // Walk forward one card at a time so every step keeps the swipe feel.
    const steps = (target - active + n) % n;
    if (steps === 1) return goNext();
    setActive(target);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy) return;
    pointer.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = pointer.current;
    if (!start) return;
    const ddx = e.clientX - start.x;
    const ddy = e.clientY - start.y;
    if (!dragging) {
      if (Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) {
        setDragging(true);
        moved.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }
    setDx(ddx);
  };

  const endDrag = () => {
    if (dragging) {
      if (Math.abs(dx) > SWIPE_DISTANCE) goNext(dx > 0 ? 1 : -1);
      setDragging(false);
      setDx(0);
    }
    pointer.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
  };

  if (n === 0) return null;

  return (
    <div className="mx-auto w-full max-w-[24rem]">
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Upcoming events"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative h-[31.5rem] rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-8"
      >
        {events.map((event, i) => {
          const p = (i - active + n) % n;
          const isLeaving = leaving?.idx === i;
          const isEnteringStart = entering?.idx === i && !entering.go;
          const isTop = p === 0 && !isLeaving;

          let transform: string;
          let opacity: number;
          let zIndex = n - p;

          if (isLeaving && leaving) {
            transform = `translate3d(${leaving.dir * 125}%, -24px, 0) rotate(${leaving.dir * 16}deg)`;
            opacity = 0;
            zIndex = n + 2;
          } else if (isEnteringStart) {
            transform = "translate3d(-125%, -24px, 0) rotate(-16deg)";
            opacity = 0;
            zIndex = n + 2;
          } else if (p === 0) {
            transform = dragging ? `translate3d(${dx}px, 0, 0) rotate(${dx * 0.045}deg)` : "none";
            opacity = 1;
          } else if (p < visible) {
            const d = DEPTH[p];
            transform = `translate3d(0, ${d.y}px, 0) scale(${d.s}) rotate(${d.r}deg)`;
            opacity = d.o;
          } else {
            transform = "translate3d(0, 64px, 0) scale(0.8)";
            opacity = 0;
          }

          // A card that just flew off re-appears at the back with a fade, not a flight.
          const instant = recycled === i || isEnteringStart;
          if (recycled === i) opacity = 0;

          const parts = eventDateParts(event.date);

          return (
            <article
              key={event.id}
              data-top={isTop}
              data-dragging={isTop && dragging}
              data-instant={instant}
              inert={!isTop}
              aria-hidden={!isTop}
              aria-label={`${event.title}, ${i + 1} of ${n}`}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? endDrag : undefined}
              onPointerCancel={isTop ? endDrag : undefined}
              onClickCapture={
                isTop
                  ? (e) => {
                      if (moved.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        moved.current = false;
                      }
                    }
                  : undefined
              }
              style={{ transform, opacity, zIndex, transformOrigin: "50% 100%" }}
              className={cn(
                "stack-card glass-strong absolute inset-x-0 top-0 flex h-[28rem] flex-col overflow-hidden rounded-[1.75rem]",
                !isTop && "pointer-events-none"
              )}
            >
              <div
                className={cn(
                  "relative bg-gradient-to-br px-6 pb-6 pt-5 text-white",
                  BANNERS[i % BANNERS.length]
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10 blur-2xl"
                />
                <div className="relative flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25">
                    {event.eventType}
                  </span>
                  <span className="text-sm text-white/75">{parts.weekday}</span>
                </div>
                <div className="relative mt-7 flex items-end gap-3">
                  <span className="font-display text-7xl font-medium leading-[0.85]">{parts.day}</span>
                  <div className="pb-0.5">
                    <p className="text-lg font-medium leading-tight">{parts.monthLong}</p>
                    <p className="text-sm text-white/70">{parts.year}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-6 pb-5 pt-5">
                <h3 className="line-clamp-3 font-display text-[1.375rem] font-medium leading-snug text-ink">
                  {event.title}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-body">
                  <li className="flex items-center gap-2.5">
                    <Clock className="size-4 shrink-0 text-blue-300" />
                    {formatTime(event.startTime)} – {formatTime(event.endTime)}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <MapPin className="size-4 shrink-0 text-blue-300" />
                    <span className="truncate">{event.venue}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="size-4 shrink-0 text-blue-300" />
                    {event.expectedAttendance} expected
                  </li>
                </ul>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="truncate text-sm text-muted">{event.organizer}</span>
                  <Button size="sm" onClick={() => onOpen(event)} tabIndex={isTop ? 0 : -1}>
                    Details
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Event {active + 1} of {n}: {events[active].title}
      </p>

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button variant="outline" size="icon" onClick={goPrev} disabled={busy || n < 2} aria-label="Previous event">
          <ChevronLeft />
        </Button>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose event">
            {events.map((e, i) => (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show ${e.title}`}
                onClick={() => jumpTo(i)}
                className="group flex h-6 cursor-pointer items-center px-0.5"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === active ? "w-6 bg-blue-600" : "w-1.5 bg-white/25 group-hover:bg-white/50"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">Swipe, drag or use the arrows</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => goNext(1)} disabled={busy || n < 2} aria-label="Next event">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
