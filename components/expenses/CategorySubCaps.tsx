"use client";

import React from "react";
import {
  AlertTriangle,
  Building2,
  Car,
  Cpu,
  PieChart,
  Printer,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CategoryCap, ExpenseCategory } from "@/lib/types/expenses";

interface CategorySubCapsProps {
  categories: CategoryCap[];
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  "Food & Catering": UtensilsCrossed,
  "Equipment & Hardware": Cpu,
  "Marketing & Swag": Sparkles,
  Transportation: Car,
  "Venue & Audio": Building2,
  "Printing & Certificates": Printer,
};

export function CategorySubCaps({ categories }: CategorySubCapsProps) {
  const formatINR = (val: number) => "₹" + val.toLocaleString("en-IN");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
            <PieChart className="size-4" />
          </span>
          <h2 className="font-display text-2xl font-medium text-ink">
            Spending by Category
          </h2>
        </div>
        <span className="text-xs text-muted">
          Maximum budget limits set for each category.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.category] || PieChart;
          const pct = Math.round((cat.spent / cat.cap) * 100);
          const left = cat.cap - cat.spent;
          const isNearCap = cat.status === "near_cap" || pct >= 70;
          const isLowBurn = cat.status === "low_burn" || pct <= 30;

          return (
            <Card
              key={cat.category}
              className="glass relative flex flex-col justify-between p-5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                      isNearCap
                        ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25"
                        : isLowBurn
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                        : "bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{cat.category}</h3>
                    <p className="text-xs text-muted">Limit: {formatINR(cat.cap)}</p>
                  </div>
                </div>

                {isNearCap ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    <AlertTriangle className="size-3" /> {pct}% Near Limit
                  </span>
                ) : isLowBurn ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                    {pct}% Low Spend
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-body">
                    {pct}% Normal
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-ink">{formatINR(cat.spent)} spent</span>
                  <span className="text-muted">{formatINR(left)} left</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isNearCap
                        ? "bg-amber-400"
                        : isLowBurn
                        ? "bg-emerald-400"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
