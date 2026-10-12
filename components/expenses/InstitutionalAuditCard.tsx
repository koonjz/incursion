"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export function InstitutionalAuditCard() {
  return (
    <Card className="glass relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 transition-transform duration-200">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
          <ShieldCheck className="size-6 text-blue-400" />
        </span>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">
              Institutional Audit & Sign-Off Mandate
            </h3>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              Compliant
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed max-w-3xl">
            Quarterly reconciliation must be endorsed by the ACM Faculty Sponsor and submitted to the Office of Dean (Student Affairs) by the 30th of March 2026. Electronic hashes are logged permanently in the collegiate registry.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
        <div className="text-right">
          <p className="text-xs font-semibold text-ink">Prof. S. Ranganathan</p>
          <p className="text-[11px] text-muted">Faculty Convenor, ACM</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-900 text-xs font-bold text-white shadow-sm ring-1 ring-white/10">
          SR
        </span>
      </div>
    </Card>
  );
}
