"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface FiscalGuardBannerProps {
  fiscalGuardText: string;
  lastReconciledText: string;
}

export function FiscalGuardBanner({
  fiscalGuardText,
  lastReconciledText,
}: FiscalGuardBannerProps) {
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3 text-sm text-body">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
          <ShieldCheck className="size-4" />
        </span>
        <span className="font-semibold uppercase tracking-wider text-xs text-blue-300">
          Budget Status
        </span>
        <span className="hidden sm:inline text-white/30">|</span>
        <span className="truncate text-xs sm:text-sm text-muted">
          {fiscalGuardText}
        </span>
      </div>
      <div className="flex items-center gap-2.5 text-xs text-muted shrink-0">
        <span>Last updated: {lastReconciledText}</span>
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      </div>
    </div>
  );
}
