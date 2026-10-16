import React from "react";
import { Building2, Users, Monitor, Volume2, Wifi, Sparkles, CheckCircle2 } from "lucide-react";
import { MOCK_VENUES } from "@/lib/mock/events";
import { SectionHead } from "./SectionHead";

// Map facilities to icons for rich visual distinction
function getFacilityIcon(f: string) {
  const lower = f.toLowerCase();
  if (lower.includes("screen") || lower.includes("projector") || lower.includes("board")) return Monitor;
  if (lower.includes("audio") || lower.includes("sound") || lower.includes("mic")) return Volume2;
  if (lower.includes("lan") || lower.includes("workstation") || lower.includes("stream")) return Wifi;
  return CheckCircle2;
}

export function Venues() {
  const max = Math.max(...MOCK_VENUES.map((v) => v.capacity));

  return (
    <section id="venues" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHead
        eyebrow="Campus Spaces"
        title="Verified venues & facility blueprints"
        text="Real-time occupancy limits, specialized A/V rigging, and seat capacity across all official university halls."
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_VENUES.map((v) => (
          <div
            key={v.id}
            className="glass group flex flex-col justify-between rounded-[var(--radius-panel)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]"
          >
            <div>
              {/* Architectural Venue Header / Blueprint Preview Slot */}
              <div className="relative mb-5 flex h-28 flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#090d18] p-3.5">
                {/* Technical Grid Overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                <div className="relative z-10 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-xs font-semibold text-blue-400">
                    ID: {v.id.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 font-medium text-emerald-300 text-[10px]">
                    Available for Booking
                  </span>
                </div>

                <div className="relative z-10">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    Facility Blueprint / Photo Archive
                  </p>
                  <p className="text-xs font-medium text-zinc-300 truncate">
                    {v.building}
                  </p>
                </div>
              </div>

              {/* Venue Name & Building */}
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {v.name}
                </h3>
                <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Building2 className="size-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{v.building}</span>
                </p>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-4 space-y-1.5 rounded-xl border border-white/6 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <Users className="size-3.5 text-blue-400" /> Seating Capacity
                  </span>
                  <span className="font-bold text-white">{v.capacity} Seats</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                    style={{ width: `${Math.round((v.capacity / max) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 text-right">
                  {Math.round((v.capacity / max) * 100)}% of campus peak scale
                </p>
              </div>
            </div>

            {/* Facility Tags */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                A/V & Hardware Rigging
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {v.facilities.map((f) => {
                  const Icon = getFacilityIcon(f);
                  return (
                    <li
                      key={f}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-blue-400/30 hover:bg-white/[0.08]"
                    >
                      <Icon className="size-3 text-blue-400" />
                      <span>{f}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
