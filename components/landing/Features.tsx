import React from "react";
import {
  Bell,
  Layers,
  Lock,
  MailCheck,
  ShieldCheck,
  Zap,
  Activity,
  FileCheck,
  CheckCircle,
} from "lucide-react";
import { SectionHead } from "./SectionHead";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Multi-Factor Clash Radar",
    text: "Simultaneously evaluates venue reservations, organizer availability, start/end windows, and audience cohort overlap as you draft.",
    badge: "Deterministic Engine",
  },
  {
    icon: Zap,
    title: "Instant Slot Optimization",
    text: "When a high-severity collision occurs, the engine automatically suggests verified unoccupied rooms and time intervals.",
    badge: "Auto-Discovery",
  },
  {
    icon: MailCheck,
    title: "ACM Core Verification Gate",
    text: "Structured faculty and student chapter review pipeline with itemized feedback, revision cycles, and timestamped sign-offs.",
    badge: "Human Oversight",
  },
  {
    icon: Layers,
    title: "Synchronized Public Calendar",
    text: "Only approved, collision-free events are published to the university directory with live filtering by category, club, and hall.",
    badge: "Single Source of Truth",
  },
  {
    icon: Bell,
    title: "Real-Time Pipeline Auditing",
    text: "Track event progression from initial draft and clash calculation to faculty review, revision requests, and calendar confirmation.",
    badge: "Full Transparency",
  },
  {
    icon: Lock,
    title: "Role-Based Campus Permissions",
    text: "Club leads securely manage their submissions and budgets while ACM Core verifiers access institutional oversight tools.",
    badge: "Enterprise RBAC",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHead
        eyebrow="Platform Capabilities"
        title="Engineered for campus event operations"
        text="Replace fragmented WhatsApp groups, ad-hoc approvals, and double-booked lecture halls with a robust institutional operating system."
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text, badge }) => (
          <div
            key={title}
            className="glass group flex flex-col justify-between rounded-[var(--radius-panel)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                  <Icon className="size-5" />
                </span>
                <span className="font-mono text-[10px] uppercase font-semibold text-zinc-400 bg-white/[0.04] border border-white/8 px-2 py-0.5 rounded">
                  {badge}
                </span>
              </div>

              <h3 className="font-display text-lg font-bold text-white group-hover:text-blue-200 transition-colors">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300 font-normal">
                {text}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/6 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle className="size-3.5" />
              <span>Production Ready</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
