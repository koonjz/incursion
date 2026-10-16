import React from "react";
import Link from "next/link";
import { Activity, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const COLS = [
  {
    title: "Platform",
    links: [
      { label: "Confirmed Events", href: "/#events" },
      { label: "Live Clash Radar", href: "/#showcase" },
      { label: "Central Calendar", href: "/#calendar" },
      { label: "Lecture Halls & Venues", href: "/#venues" },
    ],
  },
  {
    title: "Governance",
    links: [
      { label: "Approval Workflow", href: "/#workflow" },
      { label: "Platform Capabilities", href: "/#features" },
      { label: "Booking Guidelines & FAQ", href: "/#faq" },
      { label: "Conflict Matrix Spec", href: "/#showcase" },
    ],
  },
  {
    title: "Club Organizers",
    links: [
      { label: "Sign In to Portal", href: "/login" },
      { label: "Submit New Proposal", href: "/login" },
      { label: "Review Queue (ACM Core)", href: "/login" },
      { label: "Budget & Claims", href: "/login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#060810] text-zinc-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {/* Brand Column */}
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-xs leading-relaxed text-zinc-400">
            Institutional campus event operations and conflict-resolution engine. Built by the ACM Student Chapter for university organizations, student councils, and department faculty.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All Systems Nominal</span>
          </div>
        </div>

        {/* Link Columns */}
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              {c.title}
            </p>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-xs text-zinc-400 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/8 py-6">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 text-xs text-zinc-400 sm:px-6">
          <p>© 2026 ACM Resolve. Developed for Campus Student Bodies.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-zinc-400">Version 2.4.0-dark</span>
            <span className="h-3 w-px bg-white/10" />
            <Link href="/login" className="hover:text-white transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
