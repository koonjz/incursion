import React from "react";
import { ArrowRight, CheckCircle2, Send, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { MOCK_CLUBS } from "@/lib/mock/events";
import { SectionHead } from "./SectionHead";

const STEPS = [
  {
    step: "01",
    title: "Draft & Venue Request",
    text: "Input your event agenda, requested lecture hall, date range, expected turnout, and target student audience.",
    icon: Send,
  },
  {
    step: "02",
    title: "Live Clash Calculation",
    text: "The deterministic radar instantly scans university calendars, detecting room collisions or concurrent audience targeting.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "ACM Core Verification",
    text: "Reviewers inspect equipment feasibility, budget thresholds, and conflict logs, providing rapid decisions with feedback.",
    icon: UserCheck,
  },
  {
    step: "04",
    title: "Live Publication",
    text: "Approved gatherings automatically synchronize with the central campus calendar and student notification channels.",
    icon: Sparkles,
  },
];

export function Process() {
  return (
    <section id="workflow" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="workflow-title">
      <SectionHead
        eyebrow="Structured Governance"
        title="From club proposal to verified calendar"
        text="A frictionless, transparent four-stage pipeline ensuring zero scheduling overlap across all university departments."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 relative">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="glass group relative flex flex-col justify-between rounded-[var(--radius-panel)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-3xl font-black text-blue-500/30 group-hover:text-blue-400 transition-colors">
                    {s.step}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 group-hover:border-blue-400/40 group-hover:text-white transition-colors">
                    <Icon className="size-4 text-blue-400" />
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-white group-hover:text-blue-200 transition-colors">
                  {s.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                  {s.text}
                </p>
              </div>

              <div className="mt-5 border-t border-white/8 pt-3 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <span>Stage {i + 1} of 4</span>
                <span className="text-blue-400 font-semibold">Active Engine</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verified Partner Chapters & Societies */}
      <div className="mt-16 rounded-[var(--radius-hero)] border border-white/10 bg-[#090d18] p-7 sm:p-9 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="font-display text-xl font-bold text-white">
              Verified Campus Chapters & Student Societies
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Currently synchronizing events, venues, and clash detection on ACM Resolve.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="size-4" />
            <span>Institutional Multi-Tenant Registry</span>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2.5">
          {MOCK_CLUBS.map((c) => (
            <li
              key={c.id}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-blue-400/50 hover:bg-white/[0.08] hover:text-white"
            >
              <span className="size-1.5 rounded-full bg-blue-400" />
              <span>{c.name}</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                {c.category}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
