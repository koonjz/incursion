import React from "react";
import { Code2, Handshake, Mic, Music, Presentation, Trophy, Wrench, Sparkles, ArrowUpRight } from "lucide-react";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { SectionHead } from "./SectionHead";
import type { EventType } from "@/lib/types/event";

const TYPES: {
  type: EventType;
  label: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    type: "Workshop",
    label: "Technical Workshops",
    text: "Intensive architecture, coding labs, and systems deep-dives.",
    icon: Wrench,
    accent: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  },
  {
    type: "Symposium",
    label: "Academic Symposiums",
    text: "Research keynotes, inter-department panels, and faculty lectures.",
    icon: Presentation,
    accent: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
  },
  {
    type: "Hackathon",
    label: "24h Hackathons",
    text: "Overnight product sprints, agent jams, and prototype demos.",
    icon: Code2,
    accent: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
  },
  {
    type: "Guest Lecture",
    label: "Industry Guest Talks",
    text: "Keynotes from researchers, open-source maintainers, and founders.",
    icon: Mic,
    accent: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  },
  {
    type: "Competition",
    label: "Contests & Showdowns",
    text: "Algorithmic rounds, CTF security games, and robotics arenas.",
    icon: Trophy,
    accent: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  },
  {
    type: "Cultural",
    label: "Arts & Culture Nights",
    text: "Campus musical evenings, design showcases, and talent nights.",
    icon: Music,
    accent: "text-rose-400 bg-rose-500/15 border-rose-500/30",
  },
  {
    type: "Networking",
    label: "Alumni & Mixer Events",
    text: "Career guidance circles, mentoring mixers, and club recruitments.",
    icon: Handshake,
    accent: "text-violet-400 bg-violet-500/15 border-violet-500/30",
  },
];

export function Categories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHead
        eyebrow="Format Diversity"
        title="Scheduled event categories"
        text="From overnight competitive hackathons to academic faculty symposiums, every format is tracked with custom attendance thresholds."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map(({ type, label, text, icon: Icon, accent }) => {
          const count = MOCK_EVENTS.filter((e) => e.eventType === type).length;
          return (
            <div
              key={type}
              className="glass group flex flex-col justify-between rounded-[var(--radius-panel)] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_18px_36px_-12px_rgba(0,0,0,0.7)]"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`flex size-11 items-center justify-center rounded-xl border ${accent} transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                    {count} {count === 1 ? "Event" : "Events"}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-white group-hover:text-blue-200 transition-colors">
                  {label}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {text}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                <span>Verified in term</span>
                <span className="text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Active <ArrowUpRight className="size-3" />
                </span>
              </div>
            </div>
          );
        })}

        {/* Custom Submission Tile */}
        <div className="glass-strong flex flex-col justify-between rounded-[var(--radius-panel)] p-5 sm:col-span-2 lg:col-span-1 border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-[#0a0d18]">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/20 text-blue-300 mb-3.5">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-display text-base font-bold text-white">
              Specialized Formats
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Host an unlisted or hybrid gathering? Our conflict detector automatically models multi-room bookings and complex requirements.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-xs font-semibold text-blue-300">
            Automated conflict modeling →
          </div>
        </div>
      </div>
    </section>
  );
}
