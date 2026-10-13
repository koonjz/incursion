"use client";

import React from "react";
import { CreditCard, Landmark, PiggyBank, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ExpenseMetricsCardsProps {
  grantAllocation: number;
  totalDisbursed: number;
  remainingLedger: number;
  claimsCount: number;
  underForecastDelta: number;
  utilizationPercent: number;
}

export function ExpenseMetricsCards({
  grantAllocation,
  totalDisbursed,
  remainingLedger,
  claimsCount,
  underForecastDelta,
  utilizationPercent,
}: ExpenseMetricsCardsProps) {
  const formatINR = (val: number) => "₹" + val.toLocaleString("en-IN");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Card 1: Semester Budget */}
      <Card className="glass relative overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Semester Budget</span>
          <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
            <Landmark className="size-4" />
          </span>
        </div>
        <div className="mt-4 flex flex-col">
          <span className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            {formatINR(grantAllocation)}
          </span>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-0.5 text-xs font-semibold text-blue-200">
              Allocated Budget
            </span>
            <span className="text-xs text-muted">Approved by College</span>
          </div>
        </div>
      </Card>

      {/* Card 2: Total Spent */}
      <Card className="glass relative overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Total Spent</span>
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20">
            <CreditCard className="size-4" />
          </span>
        </div>
        <div className="mt-4 flex flex-col">
          <span className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            {formatINR(totalDisbursed)}
          </span>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
              {utilizationPercent.toFixed(1)}% Spent
            </span>
            <span className="text-xs text-muted">{claimsCount} Bills recorded</span>
          </div>
        </div>
      </Card>

      {/* Card 3: Money Remaining */}
      <Card className="glass relative overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Money Remaining</span>
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
            <PiggyBank className="size-4" />
          </span>
        </div>
        <div className="mt-4 flex flex-col">
          <span className="font-display text-3xl font-medium tracking-tight text-emerald-300 sm:text-4xl">
            {formatINR(remainingLedger)}
          </span>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              On Track
            </span>
            <span className="text-xs text-muted">+{formatINR(underForecastDelta)} under budget</span>
          </div>
        </div>
      </Card>

      {/* Card 4: Budget Used */}
      <Card className="glass relative overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Budget Used</span>
          <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300 flex items-center gap-1">
            <ShieldAlert className="size-3" /> 80% Limit Warning
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl font-medium text-ink">
              {utilizationPercent.toFixed(1)}%
            </span>
            <span className="text-xs text-muted">Limit: ₹80,000</span>
          </div>
          {/* Progress Bar with 80% threshold line */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
            {/* 80% threshold marker */}
            <div
              className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-rose-400"
              title="80% Warning Limit"
            />
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-muted">
            <span>0% (₹0)</span>
            <span className="text-rose-300 font-medium">80% Warning Line</span>
            <span>100% (₹1L)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
