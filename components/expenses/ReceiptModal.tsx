"use client";

import React from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Receipt,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ExpenseClaim } from "@/lib/types/expenses";

interface ReceiptModalProps {
  claim: ExpenseClaim | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptModal({ claim, open, onOpenChange }: ReceiptModalProps) {
  if (!claim) return null;

  const formatINR = (val: number) => "₹" + val.toLocaleString("en-IN");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden glass-strong border-white/12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
              <FileText className="size-4" />
            </span>
            <DialogTitle className="font-display text-xl font-medium text-ink">
              Receipt Details
            </DialogTitle>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="glass-inset rounded-2xl p-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-muted tracking-wider">
                Receipt File
              </span>
              <span className="font-mono text-xs font-semibold text-blue-300">
                {claim.receiptName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-muted tracking-wider">
                Store / Vendor
              </span>
              <span className="font-medium text-ink">{claim.merchant}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-muted tracking-wider">
                Total Amount
              </span>
              <span className="font-display text-2xl font-bold text-ink">
                {formatINR(claim.amount)}
              </span>
            </div>
          </div>

          {/* Simulated Document Frame */}
          <div className="glass-inset rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2.5 border border-dashed border-white/15">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-300">
              <Receipt className="size-8" />
            </span>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-ink">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Bill Verified
              </div>
              <p className="mt-1 font-mono text-xs text-muted">
                GSTIN: {claim.gstin || "27AABCT3518Q1ZV"} • Date: {claim.date}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-white/[0.02]">
          <button
            type="button"
            onClick={() => alert(`Opening ${claim.receiptName}...`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink className="size-3.5" />
            View Full Bill
          </button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
