"use client";

import React from "react";
import {
  BarChart3,
  CheckCircle2,
  TrendingDown,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export function EventVarianceSection() {

  return (
    <Card className="glass relative overflow-hidden p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
              Event Focus 01
            </span>
            <span className="text-xs font-medium text-muted">
              Event Code: ACM-HK-26
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-ink">
            ACM Hackathon 2026 — Spending Breakdown
          </h2>
          <p className="text-sm text-muted max-w-3xl">
            See how much was planned vs actually spent for 300 hackathon participants.
          </p>
        </div>

        {/* Summary Chip */}
        <div className="glass-inset flex items-center gap-4 rounded-2xl p-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Spent
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-blue-400">
              ₹16,700
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Planned Budget
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-ink">
              ₹18,000
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-emerald-300">
            <CheckCircle2 className="size-4" />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-none">92%</span>
              <span className="text-[10px] text-emerald-400">On Budget</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Left chart (8 cols), Right ratio & proof (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Chart (8 cols) */}
        <div className="xl:col-span-8 glass-inset rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-blue-400" />
              <span className="text-sm font-semibold text-ink">
                Actual Spending vs. Planned Limit (₹)
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-body">
                <span className="size-3 rounded-xs bg-blue-500 inline-block" />
                Money Spent
              </span>
              <span className="flex items-center gap-1.5 text-body">
                <span className="size-3 rounded-xs bg-white/20 inline-block" />
                Planned Limit
              </span>
            </div>
          </div>

          {/* SVG Visual Bar Canvas */}
          <div className="w-full overflow-x-auto py-2">
            <svg
              className="w-full min-w-[550px] h-56 select-none font-sans text-[11px]"
              fill="none"
              viewBox="0 0 760 220"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Grid Lines */}
              <line stroke="rgba(255,255,255,0.08)" strokeWidth="1" x1="50" x2="740" y1="180" y2="180" />
              <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="1" x1="50" x2="740" y1="135" y2="135" />
              <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="1" x1="50" x2="740" y1="90" y2="90" />
              <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" strokeWidth="1" x1="50" x2="740" y1="45" y2="45" />

              {/* Y-Axis Ticks */}
              <text fill="#8f9bb8" textAnchor="end" x="42" y="184">₹0</text>
              <text fill="#8f9bb8" textAnchor="end" x="42" y="139">₹3,000</text>
              <text fill="#8f9bb8" textAnchor="end" x="42" y="94">₹6,000</text>
              <text fill="#8f9bb8" textAnchor="end" x="42" y="49">₹9,000</text>

              {/* Group 1: Catering */}
              <rect fill="rgba(255,255,255,0.12)" height="135" rx="4" width="44" x="100" y="45" />
              <rect fill="#3b82f6" height="128" rx="3" width="24" x="110" y="52" />
              <text fill="#93c5fd" fontWeight="600" textAnchor="middle" x="122" y="44">₹8,500</text>
              <text fill="#f2f6ff" fontWeight="500" textAnchor="middle" x="122" y="198">Catering</text>
              <text fill="#8f9bb8" fontSize="10" textAnchor="middle" x="122" y="212">(Limit: 9k)</text>

              {/* Group 2: Trophies & Medals */}
              <rect fill="rgba(255,255,255,0.12)" height="68" rx="4" width="44" x="260" y="112" />
              <rect fill="#3b82f6" height="63" rx="3" width="24" x="270" y="117" />
              <text fill="#93c5fd" fontWeight="600" textAnchor="middle" x="282" y="110">₹4,200</text>
              <text fill="#f2f6ff" fontWeight="500" textAnchor="middle" x="282" y="198">Trophies & Medals</text>
              <text fill="#8f9bb8" fontSize="10" textAnchor="middle" x="282" y="212">(Limit: 4.5k)</text>

              {/* Group 3: Swag & Badges */}
              <rect fill="rgba(255,255,255,0.12)" height="45" rx="4" width="44" x="420" y="135" />
              <rect fill="#3b82f6" height="42" rx="3" width="24" x="430" y="138" />
              <text fill="#93c5fd" fontWeight="600" textAnchor="middle" x="442" y="132">₹2,800</text>
              <text fill="#f2f6ff" fontWeight="500" textAnchor="middle" x="442" y="198">Swag & Badges</text>
              <text fill="#8f9bb8" fontSize="10" textAnchor="middle" x="442" y="212">(Limit: 3k)</text>

              {/* Group 4: Flex Banners */}
              <rect fill="rgba(255,255,255,0.12)" height="23" rx="4" width="44" x="580" y="157" />
              <rect fill="#3b82f6" height="18" rx="3" width="24" x="590" y="162" />
              <text fill="#93c5fd" fontWeight="600" textAnchor="middle" x="602" y="155">₹1,200</text>
              <text fill="#f2f6ff" fontWeight="500" textAnchor="middle" x="602" y="198">Flex Banners</text>
              <text fill="#8f9bb8" fontSize="10" textAnchor="middle" x="602" y="212">(Limit: 1.5k)</text>

              {/* Target Trajectory Trend Path (Spline) */}
              <path
                d="M122 52 Q 282 117 442 138 T 602 162"
                fill="none"
                opacity="0.8"
                stroke="#60a5fa"
                strokeDasharray="4 4"
                strokeWidth="2"
              />
              <circle cx="122" cy="52" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" r="4" />
              <circle cx="282" cy="117" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" r="4" />
              <circle cx="442" cy="138" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" r="4" />
              <circle cx="602" cy="162" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" r="4" />
            </svg>
          </div>

          {/* Chart Variance Sub-Banner */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/6 px-4 py-2.5 text-xs text-muted">
            <div className="flex items-center gap-2">
              <TrendingDown className="size-4 text-emerald-400" />
              <span>
                Difference: <strong className="text-emerald-300">Saved ₹1,300</strong> (7.2% below planned budget)
              </span>
            </div>
            <span className="font-medium text-blue-300">
              Verified with Bill Receipts
            </span>
          </div>
        </div>

        {/* Right column: Cost per Student (4 cols) */}
        <div className="xl:col-span-4 flex flex-col">
          <div className="glass-inset rounded-2xl p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Cost per Student</span>
              <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
                <Users className="size-4" />
              </span>
            </div>
            <div className="my-auto py-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-blue-400">
                  ₹55.60
                </span>
                <span className="text-sm text-muted">/ per student</span>
              </div>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                Calculated for 300 registered students. Well below the ₹75.00 per person limit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
