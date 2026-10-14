"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Layers,
  ArrowRight,
  Terminal,
  GraduationCap,
  Code2,
  Presentation,
  Trophy,
  Sparkles,
  Network,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, eventDateParts, formatTime } from "@/lib/utils";
import type { CampusEvent, EventType } from "@/lib/types/event";

// Restrained, premium cyan and electric-slate card themes matching the particle wave
const CARD_THEMES = [
  {
    border: "border-cyan-500/25",
    glow: "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9),0_0_25px_-5px_rgba(6,182,212,0.12)]",
    pill: "bg-cyan-500/10 text-cyan-300 border-cyan-400/30",
    dateGradient: "from-cyan-950/40 via-[#0a121e] to-[#070b14]",
  },
  {
    border: "border-sky-500/25",
    glow: "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9),0_0_25px_-5px_rgba(56,189,248,0.12)]",
    pill: "bg-sky-500/10 text-sky-300 border-sky-400/30",
    dateGradient: "from-sky-950/40 via-[#0a121e] to-[#070b14]",
  },
  {
    border: "border-teal-500/25",
    glow: "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9),0_0_25px_-5px_rgba(20,184,166,0.12)]",
    pill: "bg-teal-500/10 text-teal-300 border-teal-400/30",
    dateGradient: "from-teal-950/40 via-[#0a121e] to-[#070b14]",
  },
  {
    border: "border-blue-500/25",
    glow: "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9),0_0_25px_-5px_rgba(59,130,246,0.12)]",
    pill: "bg-blue-500/10 text-blue-300 border-blue-400/30",
    dateGradient: "from-blue-950/40 via-[#0a121e] to-[#070b14]",
  },
];

// Physical layered deck depth with subtle rotation and scaling
const DEPTH = [
  { y: 0, s: 1, r: 0, o: 1 },
  { y: 10, s: 0.96, r: -1.2, o: 0.82 },
  { y: 20, s: 0.92, r: 1.2, o: 0.62 },
  { y: 30, s: 0.88, r: -0.6, o: 0.38 },
];

const FLY_MS = 380;
const SWIPE_DISTANCE = 60;

type Leaving = { idx: number; dir: 1 | -1 };
type Entering = { idx: number; go: boolean };

/**
 * Meaningful category icon identification using only installed lucide-react icons
 */
function CategoryIcon({ type }: { type: EventType }) {
  switch (type) {
    case "Workshop":
      return <Terminal className="size-3.5 text-cyan-400 shrink-0" />;
    case "Symposium":
      return <GraduationCap className="size-3.5 text-cyan-400 shrink-0" />;
    case "Hackathon":
      return <Code2 className="size-3.5 text-cyan-400 shrink-0" />;
    case "Guest Lecture":
      return <Presentation className="size-3.5 text-cyan-400 shrink-0" />;
    case "Competition":
      return <Trophy className="size-3.5 text-amber-400 shrink-0" />;
    case "Cultural":
      return <Sparkles className="size-3.5 text-purple-400 shrink-0" />;
    case "General Meeting":
      return <Users className="size-3.5 text-blue-400 shrink-0" />;
    case "Networking":
      return <Network className="size-3.5 text-teal-400 shrink-0" />;
    default:
      return <Calendar className="size-3.5 text-cyan-400 shrink-0" />;
  }
}

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
  const [flipped, setFlipped] = useState(false);

  const busy = leaving !== null || entering !== null;
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const nextFrame = useCallback((fn: () => void) => {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }, []);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(window.clearTimeout);
  }, []);

  const goNext = useCallback(
    (dir: 1 | -1 = 1) => {
      if (busy || n < 2) return;
      setFlipped(false);
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
    setFlipped(false);
    const idx = (active - 1 + n) % n;
    setActive(idx);
    setEntering({ idx, go: false });
    nextFrame(() => setEntering({ idx, go: true }));
    later(() => setEntering(null), 500);
  }, [active, busy, later, n, nextFrame]);

  const jumpTo = (target: number) => {
    if (busy || target === active) return;
    setFlipped(false);
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
    } else if (e.key === " " || e.key === "f" || e.key === "F") {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  };

  if (n === 0) return null;

  return (
    <div className="mx-auto w-full max-w-[34rem] sm:max-w-[36rem] lg:max-w-[38rem] xl:max-w-[42rem] min-w-0">
      {/* Top Deck Action Bar */}
      <div className="mb-3 flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-medium min-w-0">
          <Layers className="size-3.5 text-cyan-400 shrink-0" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 truncate">
            Event Frame
          </span>
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[11px] font-mono text-cyan-300 shrink-0">
            {active + 1} / {n}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFlipped(!flipped)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 sm:px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-cyan-500/30 hover:bg-white/[0.08] hover:text-white shrink-0"
        >
          <RotateCw
            className={cn(
              "size-3 text-cyan-400 transition-transform duration-300",
              flipped && "rotate-180"
            )}
          />
          <span>{flipped ? "Event Card" : "Diagnostics"}</span>
        </button>
      </div>

      {/* Main Widescreen Card Stack Container with Overflow Guard */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Upcoming campus events deck"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative h-[25.5rem] sm:h-[22rem] rounded-3xl overflow-hidden sm:overflow-visible focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-8"
      >
        {events.map((event, i) => {
          const p = (i - active + n) % n;
          const isLeaving = leaving?.idx === i;
          const isEnteringStart = entering?.idx === i && !entering.go;
          const isTop = p === 0 && !isLeaving;
          const theme = CARD_THEMES[i % CARD_THEMES.length];

          let transform: string;
          let opacity: number;
          let zIndex = n - p;

          if (isLeaving && leaving) {
            transform = `translate3d(${leaving.dir * 115}%, -16px, 0) rotate(${leaving.dir * 10}deg)`;
            opacity = 0;
            zIndex = n + 2;
          } else if (isEnteringStart) {
            transform = "translate3d(-115%, -16px, 0) rotate(-10deg)";
            opacity = 0;
            zIndex = n + 2;
          } else if (p === 0) {
            transform = dragging
              ? `translate3d(${dx}px, 0, 0) rotate(${dx * 0.03}deg)`
              : "none";
            opacity = 1;
          } else if (p < visible) {
            const d = DEPTH[p];
            transform = `translate3d(0, ${d.y}px, 0) scale(${d.s}) rotate(${d.r}deg)`;
            opacity = d.o;
          } else {
            transform = "translate3d(0, 40px, 0) scale(0.85)";
            opacity = 0;
          }

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
              aria-label={`${event.title}, card ${i + 1} of ${n}`}
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
              style={{
                transform,
                opacity,
                zIndex,
                transformOrigin: "50% 100%",
              }}
              className={cn(
                "stack-card absolute inset-x-0 top-0 flex h-[23.5rem] sm:h-[20.5rem] flex-col overflow-hidden rounded-[1.5rem] border bg-[#080c14]/95 backdrop-blur-xl transition-shadow",
                theme.border,
                theme.glow,
                !isTop && "pointer-events-none select-none"
              )}
            >
              {/* Subtle top cyan hairline light */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

              {/* CARD HEADER: Category (with icon) + Verified Status (with icon) */}
              <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-2.5 sm:px-5 sm:py-3 bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur shrink-0",
                      theme.pill
                    )}
                  >
                    <CategoryIcon type={event.eventType} />
                    <span>{event.eventType}</span>
                  </span>
                  <span className="hidden sm:inline text-xs text-zinc-400 font-medium truncate">
                    {event.club}
                  </span>
                </div>

                {/* Conflict / Verification status with icon */}
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-medium backdrop-blur shrink-0">
                  {event.conflictSeverity === "none" ? (
                    <>
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-medium text-[11px] sm:text-xs">
                        Verified • No Clash
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="size-3.5 text-amber-400" />
                      <span className="text-amber-300 font-medium text-[11px] sm:text-xs">
                        {event.conflictSeverity === "critical"
                          ? "Critical Clash"
                          : "Overlap Flagged"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* CARD CORE: FRONT VIEW vs DIAGNOSTICS VIEW */}
              {!flipped || !isTop ? (
                /* FRONT VIEW - Two Column Body (Stacks on mobile, side-by-side on sm+) */
                <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-3 sm:gap-5 items-stretch min-w-0">
                    {/* Left Frame: Prominent Date Block */}
                    <div
                      className={cn(
                        "rounded-2xl border border-cyan-500/20 shadow-inner relative overflow-hidden bg-gradient-to-b",
                        theme.dateGradient,
                        // Mobile: compact horizontal bar
                        "flex items-center justify-between p-2.5 sm:flex-col sm:justify-center sm:p-3 sm:text-center"
                      )}
                    >
                      {/* Mobile left side: Day and Month/Year */}
                      <div className="flex items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0">
                        {/* Sub-label weekday */}
                        <span className="hidden sm:block text-[10px] tracking-widest uppercase font-semibold text-cyan-400 sm:mb-1">
                          {parts.weekdayLong.toUpperCase()}
                        </span>

                        {/* Prominent Day number */}
                        <span className="font-display text-2xl sm:text-4xl lg:text-[2.75rem] font-bold text-white tracking-tight leading-none">
                          {parts.day}
                        </span>

                        {/* Month & Year */}
                        <span className="text-xs font-semibold text-zinc-300 tracking-wide sm:mt-1">
                          {parts.month.toUpperCase()} {parts.year}
                        </span>
                      </div>

                      {/* Mobile right side: Weekday + Time */}
                      <div className="flex items-center gap-2 sm:flex-col sm:gap-0 sm:mt-2">
                        <span className="sm:hidden text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                          {parts.weekday.toUpperCase()}
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                          <Clock className="size-3 text-cyan-400 shrink-0" />
                          <span>{formatTime(event.startTime)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Frame: Title, Description & Metadata Row */}
                    <div className="flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="line-clamp-2 font-display text-base sm:text-lg lg:text-xl font-bold leading-snug text-white break-words">
                          {event.title}
                        </h3>

                        <p className="mt-1 text-xs text-zinc-300 line-clamp-2 leading-relaxed break-words">
                          {event.description}
                        </p>
                      </div>

                      {/* Metadata Row: time, venue, expected attendees (each with icon, wrapping naturally) */}
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-zinc-300">
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1">
                          <Clock className="size-3.5 shrink-0 text-cyan-400" />
                          <span className="truncate">
                            {formatTime(event.startTime)} – {formatTime(event.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1">
                          <MapPin className="size-3.5 shrink-0 text-cyan-400" />
                          <span className="truncate font-medium text-white">
                            {event.venue}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1">
                          <Users className="size-3.5 shrink-0 text-cyan-400" />
                          <span className="truncate">
                            {event.expectedAttendance} Attendees
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Footer: Organizer info and unchanged Action button */}
                  <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5">
                    <div className="flex items-center gap-2 truncate text-xs text-zinc-400 min-w-0">
                      <span className="truncate">
                        Host:{" "}
                        <strong className="text-zinc-200 font-medium">
                          {event.organizer}
                        </strong>
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => onOpen(event)}
                      tabIndex={isTop ? 0 : -1}
                      className="h-8 px-4 text-xs font-semibold bg-white text-zinc-950 hover:bg-cyan-100 hover:text-black transition-colors shadow-sm shrink-0"
                    >
                      <span>Full Brief</span>
                      <ArrowRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* BACK / DIAGNOSTICS VIEW - Radar Specs */
                <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5 bg-[#070b14] animate-in fade-in zoom-in-95 duration-200 min-w-0">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 truncate">
                          Radar Diagnostics & Specs
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                        {event.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2 min-w-0">
                        <span className="text-[10px] uppercase text-zinc-400 block font-mono">
                          Allocated Venue
                        </span>
                        <span className="font-semibold text-white mt-0.5 block truncate">
                          {event.venue}
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2 min-w-0">
                        <span className="text-[10px] uppercase text-zinc-400 block font-mono">
                          Schedule Window
                        </span>
                        <span className="font-semibold text-cyan-300 mt-0.5 block truncate">
                          {formatTime(event.startTime)} – {formatTime(event.endTime)}
                        </span>
                      </div>
                    </div>

                    {/* Conflict Risk Engine State */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-400 truncate">
                          Conflict Radar Assessment:
                        </span>
                        <span
                          className={cn(
                            "font-semibold text-[11px] shrink-0",
                            event.conflictSeverity === "none"
                              ? "text-emerald-400"
                              : "text-amber-400"
                          )}
                        >
                          {event.conflictSeverity === "none"
                            ? "Verified Safe"
                            : "Clash Flagged"}
                        </span>
                      </div>
                    </div>

                    {/* Target Audience Scope */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-zinc-400 mr-1">
                        Audience:
                      </span>
                      {event.audience.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                    <button
                      type="button"
                      onClick={() => setFlipped(false)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                    >
                      ← Return to Card
                    </button>
                    <Button
                      size="sm"
                      onClick={() => onOpen(event)}
                      className="h-8 px-4 text-xs font-semibold bg-white text-zinc-950 hover:bg-cyan-100 hover:text-black transition-colors"
                    >
                      Full Details
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Event {active + 1} of {n}: {events[active].title}
      </p>

      {/* Tactile Deck Controls */}
      <div className="mt-3 flex items-center justify-between gap-4 px-1">
        <Button
          variant="secondary"
          size="icon"
          onClick={goPrev}
          disabled={busy || n < 2}
          aria-label="Previous event card"
          className="size-9 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.12] text-zinc-200 transition-colors shrink-0"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex flex-col items-center gap-1 min-w-0">
          <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="Deck progress"
          >
            {events.map((e, i) => (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Jump to ${e.title}`}
                onClick={() => jumpTo(i)}
                className="group flex h-6 cursor-pointer items-center px-0.5"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === active
                      ? "w-8 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                      : "w-2 bg-white/20 group-hover:bg-white/40"
                  )}
                />
              </button>
            ))}
          </div>
          <span className="text-[11px] font-medium text-zinc-400 truncate">
            Swipe or use arrows • Space to flip
          </span>
        </div>

        <Button
          variant="secondary"
          size="icon"
          onClick={() => goNext(1)}
          disabled={busy || n < 2}
          aria-label="Next event card"
          className="size-9 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.12] text-zinc-200 transition-colors shrink-0"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
