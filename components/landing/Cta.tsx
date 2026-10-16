import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pb-28">
      <div className="relative overflow-hidden rounded-[var(--radius-hero)] border border-white/12 bg-gradient-to-br from-[#0e1628] via-[#090d18] to-[#060810] p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)] sm:p-12">
        {/* Subtle architectural ambient accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-blue-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-1/4 size-64 rounded-full bg-indigo-500/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <ShieldCheck className="size-3.5" />
              <span>Campus Conflict Radar Operational</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight leading-snug">
              Ready to schedule your event without calendar collisions?
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed">
              Log in with your official university credentials to draft proposals, verify room occupancy, and submit for fast-track ACM Core review.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* White primary button with dark text */}
            <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold">
              <Link href="/login">
                <span>Sign in & Submit</span>
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>

            <Button asChild size="lg" variant="secondary" className="h-12 px-5 text-sm font-medium">
              <Link href="#calendar">
                <Calendar className="size-4 mr-1 text-blue-400" />
                <span>View Full Schedule</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
