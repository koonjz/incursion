"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Clock, ShieldAlert, Sparkles } from "lucide-react";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { ConflictTimeline } from "@/components/conflicts/ConflictTimeline";
import { SuggestedSlot } from "@/components/conflicts/SuggestedSlot";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
import { SectionHead } from "./SectionHead";
import { cn } from "@/lib/utils";

const POINTS = [
  "Venue already booked? Resolve flags room availability in real-time.",
  "Audience overlap warning: Alerts organizers when two events target the same students.",
  "Automated intelligent resolution: One-click switch to verified open rooms and times.",
];

export function Showcase() {
  const [selectedKey, setSelectedKey] = useState<"cnf-201" | "cnf-202">("cnf-201");
  const demo = MOCK_CONFLICTS[selectedKey];
  const slot = demo.suggestedSlots[0];

  return (
    <section id="showcase" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Column: Context & Feature bullets */}
        <div>
          <SectionHead
            className="mb-8"
            eyebrow="Conflict Radar Engine"
            title="Pre-empt schedule clashes before submission"
            text="Planning a campus event traditionally meant messy email chains and last-minute room evictions. ACM Resolve calculates live availability and clash probabilities as you type."
          />

          {/* Interactive Scenario Switcher */}
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Interactive Simulation Scenarios
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setSelectedKey("cnf-201")}
                className={cn(
                  "flex-1 rounded-xl border p-3 text-left transition-all",
                  selectedKey === "cnf-201"
                    ? "border-blue-500/50 bg-blue-500/10 text-white shadow-sm"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Scenario 1: LT-2 Clash</span>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                    High Overlap
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1">
                  Distributed Systems vs. IEEE Symposium
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedKey("cnf-202")}
                className={cn(
                  "flex-1 rounded-xl border p-3 text-left transition-all",
                  selectedKey === "cnf-202"
                    ? "border-rose-500/50 bg-rose-500/10 text-white shadow-sm"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Scenario 2: Audi A Lockout</span>
                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                    Critical
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1">
                  HackResolve 24h vs. Cultural Evening
                </p>
              </button>
            </div>
          </div>

          <ul className="space-y-3.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Live Interactive Simulation Card */}
        <div className="glass-strong space-y-6 rounded-[var(--radius-hero)] p-6 sm:p-8 border border-white/12 shadow-[0_24px_50px_-15px_rgba(0,0,0,0.9)]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="font-mono text-xs font-semibold tracking-wider text-amber-400 uppercase">
                  Live Radar Analysis
                </p>
              </div>
              <h3 className="mt-1.5 font-display text-xl sm:text-2xl font-bold leading-snug text-white">
                {demo.yourEvent.title}
              </h3>
            </div>
            <SeverityBadge severity={demo.severity} />
          </div>

          {/* Interactive Timeline */}
          <div className="rounded-xl border border-white/8 bg-[#090c16] p-4">
            <ConflictTimeline
              yourEvent={demo.yourEvent}
              competingEvent={demo.competingEvent}
              overlapMinutes={demo.overlapMinutes}
              overlapWindow={demo.overlapWindow}
            />
          </div>

          {/* Conflict Factors Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
              <span className="text-[10px] font-semibold uppercase text-zinc-400">Target Venue</span>
              <p className="font-semibold text-white mt-0.5">{demo.yourEvent.venue}</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
              <span className="text-[10px] font-semibold uppercase text-zinc-400">Audience Cohort</span>
              <p className="font-semibold text-white mt-0.5 truncate">{demo.yourEvent.audience.join(", ")}</p>
            </div>
          </div>

          {/* Suggested Resolution Slot */}
          <div className="space-y-2.5 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Recommended Solution
              </p>
              <span className="text-[11px] text-zinc-400">Zero clashing bookings</span>
            </div>
            {slot && <SuggestedSlot slot={slot} />}
          </div>
        </div>
      </div>
    </section>
  );
}
