"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small looping illustration of what ACM Resolve does:
 * two events are scheduled, a new submission overlaps one, the clash is
 * flagged, then the new event slides to a free slot.
 * Purely decorative: it uses no real event data.
 */

const START = 9;
const END = 17;
const pct = (h: number) => ((h - START) / (END - START)) * 100;

const LANES = ["Venue A", "Venue B", "Venue C"];
const TICKS = [
  { h: 9, label: "9 AM" },
  { h: 11, label: "11 AM" },
  { h: 13, label: "1 PM" },
  { h: 15, label: "3 PM" },
  { h: 17, label: "5 PM" },
];

// How long each step stays on screen (ms)
const STEP_MS = [1500, 1500, 2600, 2800];

const TONES = {
  ok: "border-cyan-400/50 bg-cyan-500/15 text-cyan-100",
  warn: "border-amber-400/60 bg-amber-500/15 text-amber-100 animate-pulse",
  done: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
};

type Block = {
  id: string;
  lane: number;
  start: number;
  end: number;
  label: string;
  visible: boolean;
  tone: keyof typeof TONES;
};

function blocksFor(step: number): Block[] {
  const clash = step === 2;
  const resolved = step === 3;
  return [
    {
      id: "a",
      lane: 0,
      start: 9,
      end: 11.5,
      label: "Workshop",
      visible: true,
      tone: clash ? "warn" : "ok",
    },
    {
      id: "b",
      lane: 1,
      start: 10,
      end: 12.5,
      label: "Lecture",
      visible: step >= 1,
      tone: "ok",
    },
    {
      id: "n",
      lane: 0,
      // Overlaps "Workshop" during the clash, then slides to a free slot
      start: resolved ? 12 : 10.5,
      end: resolved ? 14.5 : 13,
      label: "New submission",
      visible: step >= 2,
      tone: resolved ? "done" : "warn",
    },
  ];
}

const STATUS = [
  { icon: ShieldCheck, color: "text-cyan-400", text: "Schedule is clear." },
  { icon: ShieldCheck, color: "text-cyan-400", text: "Schedule is clear." },
  {
    icon: AlertTriangle,
    color: "text-amber-400",
    text: "Clash caught: new submission overlaps in Venue A.",
  },
  {
    icon: CheckCircle2,
    color: "text-emerald-400",
    text: "Resolved: moved to the next free slot.",
  },
];

export default function ClashDemo({ className }: { className?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStep(3);
      return;
    }
    let id = 0;
    const tick = (s: number) => {
      id = window.setTimeout(() => {
        const next = (s + 1) % STEP_MS.length;
        setStep(next);
        tick(next);
      }, STEP_MS[s]);
    };
    tick(0);
    return () => window.clearTimeout(id);
  }, []);

  const blocks = blocksFor(step);
  const status = STATUS[step];
  const StatusIcon = status.icon;

  return (
    <div
      role="img"
      aria-label="Illustration: ACM Resolve catches an overlapping event and moves it to a free slot."
      className={cn(
        "w-full max-w-md rounded-2xl border border-white/10 bg-[#080c14] p-4 sm:p-5",
        className
      )}
    >
      <div aria-hidden>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-cyan-400" />
            <span className="truncate font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Live conflict check
            </span>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Illustration
          </span>
        </div>

        {/* Timeline */}
        <div className="flex gap-3">
          {/* Lane labels */}
          <div className="flex w-14 shrink-0 flex-col pt-5 sm:w-16">
            {LANES.map((l) => (
              <div
                key={l}
                className="flex h-12 items-center text-[11px] font-medium text-zinc-400"
              >
                {l}
              </div>
            ))}
          </div>

          {/* Grid + blocks */}
          <div className="relative min-w-0 flex-1">
            {/* Time axis */}
            <div className="relative h-5">
              {TICKS.map((t) => (
                <span
                  key={t.h}
                  className="absolute -translate-x-1/2 font-mono text-[10px] text-zinc-500 first:translate-x-0 last:-translate-x-full"
                  style={{ left: `${pct(t.h)}%` }}
                >
                  {t.label}
                </span>
              ))}
            </div>

            {/* Lanes */}
            <div className="relative">
              {/* Vertical grid lines */}
              {TICKS.map((t) => (
                <div
                  key={t.h}
                  className="absolute inset-y-0 w-px bg-white/[0.06]"
                  style={{ left: `${pct(t.h)}%` }}
                />
              ))}

              {LANES.map((l) => (
                <div key={l} className="relative h-12 border-t border-white/[0.06]" />
              ))}

              {/* Event blocks */}
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    "absolute flex items-center overflow-hidden rounded-lg border px-2 text-[10px] font-semibold leading-tight",
                    "transition-all duration-700 ease-out motion-reduce:transition-none",
                    TONES[b.tone],
                    b.visible
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-2 scale-95 opacity-0"
                  )}
                  style={{
                    left: `${pct(b.start)}%`,
                    width: `${pct(b.end) - pct(b.start)}%`,
                    top: `${b.lane * 48 + 6}px`,
                    height: "36px",
                  }}
                >
                  <span className="truncate">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status line */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div
            key={step}
            className="flex min-w-0 items-center gap-2 text-xs text-zinc-200 animate-in fade-in duration-500"
          >
            <StatusIcon className={cn("size-4 shrink-0", status.color)} />
            <span className="truncate sm:whitespace-normal">{status.text}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {STEP_MS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === step ? "w-4 bg-cyan-400" : "w-1.5 bg-white/20"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}