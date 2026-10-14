"use client";

import React, { useState } from "react";
import { PlusCircle, UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExpenseCategory, ExpenseClaim } from "@/lib/types/expenses";
import { useAuth } from "@/lib/auth/auth-context";
import { initials } from "@/lib/utils";

interface AddExpenseClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClaim: (claim: ExpenseClaim) => void;
}

export function AddExpenseClaimModal({
  open,
  onOpenChange,
  onAddClaim,
}: AddExpenseClaimModalProps) {
  const { user } = useAuth();
  const [event, setEvent] = useState("ACM Hackathon 2026");
  const [category, setCategory] = useState<ExpenseCategory>("Food & Catering");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2026-02-14");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [receiptFile, setReceiptFile] = useState<string>("CLAIM-RCP-9041.pdf");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid disbursement amount.");
      return;
    }
    if (!description.trim()) {
      alert("Please provide an itemized description.");
      return;
    }

    const newClaim: ExpenseClaim = {
      id: `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: date || new Date().toISOString().split("T")[0],
      event,
      category,
      description: description.trim(),
      amount: parsedAmount,
      receiptName: receiptFile,
      merchant: merchant.trim() || "Campus Vendor LLC",
      addedBy: {
        name: user?.name || "Campus User",
        initials: initials(user?.name || "Campus User") || "CU",
      },
      status: "approved",
      gstin: "27AABCT3518Q1ZV",
    };

    onAddClaim(newClaim);
    onOpenChange(false);
    setDescription("");
    setAmount("");
    setMerchant("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden glass-strong border-white/12">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
              <PlusCircle className="size-4" />
            </span>
            <DialogTitle className="font-display text-xl font-medium text-ink">
              Add New Expense
            </DialogTitle>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-ink">Event Name</Label>
              <select
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ACM Hackathon 2026" className="bg-navy-950 text-white">ACM Hackathon 2026</option>
                <option value="CodeClash Monthly" className="bg-navy-950 text-white">CodeClash Monthly</option>
                <option value="AI Research Conclave" className="bg-navy-950 text-white">AI Research Conclave</option>
                <option value="ACM Technical Workshop" className="bg-navy-950 text-white">ACM Technical Workshop</option>
                <option value="General Chapter Ops" className="bg-navy-950 text-white">General Chapter Ops</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-ink">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Food & Catering" className="bg-navy-950 text-white">Food & Catering</option>
                <option value="Equipment & Hardware" className="bg-navy-950 text-white">Equipment & Hardware</option>
                <option value="Marketing & Swag" className="bg-navy-950 text-white">Marketing & Swag</option>
                <option value="Transportation" className="bg-navy-950 text-white">Transportation</option>
                <option value="Venue & Audio" className="bg-navy-950 text-white">Venue & Audio</option>
                <option value="Printing & Certificates" className="bg-navy-950 text-white">Printing & Certificates</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-ink">Amount (₹)</Label>
              <Input
                type="number"
                placeholder="e.g. 2400"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-ink">Bill Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink">Store or Vendor Name</Label>
            <Input
              type="text"
              placeholder="e.g. Campus Bites or Apex Trophy Works"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink">What was this for?</Label>
            <Input
              type="text"
              placeholder="e.g. Snacks and drinks for students and mentors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink">Upload Bill or Receipt</Label>
            <div
              onClick={() => {
                const name = prompt("Enter mock receipt filename (or leave default):", receiptFile);
                if (name) setReceiptFile(name);
              }}
              className="glass-inset rounded-2xl p-5 border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer hover:border-blue-400/50 transition-colors"
            >
              <UploadCloud className="size-6 text-blue-400" />
              <span className="text-xs font-medium text-ink">
                {receiptFile ? `Attached: ${receiptFile}` : "Click or drag bill receipt here"}
              </span>
              <span className="text-[11px] text-muted">Supports PDF, PNG, JPG (up to 5MB)</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
