"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Download,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiscalGuardBanner } from "./FiscalGuardBanner";
import { ExpenseMetricsCards } from "./ExpenseMetricsCards";
import { CategorySubCaps } from "./CategorySubCaps";
import { EventVarianceSection } from "./EventVarianceSection";
import { ExpenseLedgerTable } from "./ExpenseLedgerTable";
import { ReceiptModal } from "./ReceiptModal";
import { AddExpenseClaimModal } from "./AddExpenseClaimModal";
import { useAuth } from "@/lib/auth/auth-context";
import {
  MOCK_CATEGORY_CAPS,
  MOCK_EXPENSE_CLAIMS,
  MOCK_EXPENSE_METRICS,
} from "@/lib/mock/expenses";
import type { CategoryCap, ExpenseClaim } from "@/lib/types/expenses";

export function ExpensesBudgetView() {
  const router = useRouter();
  const { isAcmCore } = useAuth();
  const [claims, setClaims] = useState<ExpenseClaim[]>(MOCK_EXPENSE_CLAIMS);
  const [categories, setCategories] = useState<CategoryCap[]>(MOCK_CATEGORY_CAPS);
  const [selectedReceipt, setSelectedReceipt] = useState<ExpenseClaim | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [addClaimModalOpen, setAddClaimModalOpen] = useState(false);

  useEffect(() => {
    if (!isAcmCore) {
      router.replace("/dashboard");
    }
  }, [isAcmCore, router]);

  useEffect(() => {
    fetch("/api/expenses/claims?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          setClaims(data.data);
        }
      })
      .catch(() => {});
  }, []);

  if (!isAcmCore) {
    return null;
  }

  // Calculate dynamic totals
  const totalDisbursed = claims.reduce((acc, c) => acc + c.amount, 0);
  const grantAllocation = MOCK_EXPENSE_METRICS.semesterGrantAllocation;
  const remainingLedger = grantAllocation - totalDisbursed;
  const utilizationPercent = (totalDisbursed / grantAllocation) * 100;
  const underForecastDelta = Math.max(0, 60000 - totalDisbursed);

  const handleOpenReceipt = (claim: ExpenseClaim) => {
    setSelectedReceipt(claim);
    setReceiptModalOpen(true);
  };

  const handleAddClaim = async (newClaim: ExpenseClaim) => {
    setClaims((prev) => [newClaim, ...prev]);

    // Persist to Neon DB
    try {
      await fetch("/api/expenses/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newClaim.description,
          amount: newClaim.amount,
          category: newClaim.category,
          merchant: newClaim.merchant,
          receiptName: newClaim.receiptName,
          event: newClaim.event,
        }),
      });
    } catch {
      // ignore
    }

    // Update the corresponding category spent amount
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.category === newClaim.category) {
          const nextSpent = cat.spent + newClaim.amount;
          return {
            ...cat,
            spent: nextSpent,
            status: nextSpent / cat.cap >= 0.7 ? "near_cap" : cat.status,
          };
        }
        return cat;
      })
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Claim ID",
      "Date",
      "Event",
      "Category",
      "Description",
      "Amount (INR)",
      "Merchant",
      "Added By",
      "Audit Status",
      "GSTIN",
    ];

    const rows = claims.map((c) => [
      c.id,
      c.date,
      `"${c.event.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.description.replace(/"/g, '""')}"`,
      c.amount,
      `"${c.merchant.replace(/"/g, '""')}"`,
      `"${c.addedBy.name}"`,
      `"${c.status}"`,
      `"${c.gstin || "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ACM-FIN-2026-Q1.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-7 pb-10">
      {/* Dynamic Notification Bar */}
      <FiscalGuardBanner
        fiscalGuardText={MOCK_EXPENSE_METRICS.fiscalGuardText}
        lastReconciledText={MOCK_EXPENSE_METRICS.lastReconciledText}
      />

      {/* Header with Breadcrumbs & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>Finance</span>
            <ChevronRight className="size-3.5" />
            <span className="text-blue-300 font-medium">Semester Budgets</span>
            <ChevronRight className="size-3.5" />
            <span>Spring 2026</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink">
            Expenses &amp; Budget Management
          </h1>
          <p className="text-sm text-muted max-w-2xl">
            Track semester spending, club budgets, and bill receipts in one place.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-10 px-4"
          >
            <Download className="size-4 text-blue-300" />
            Download Report (CSV)
          </Button>
          <Button
            size="sm"
            onClick={() => setAddClaimModalOpen(true)}
            className="text-xs h-10 px-4 font-semibold"
          >
            <PlusCircle className="size-4" />
            + Add New Expense
          </Button>
        </div>
      </div>

      {/* Top Financial Summary Metrics */}
      <ExpenseMetricsCards
        grantAllocation={grantAllocation}
        totalDisbursed={totalDisbursed}
        remainingLedger={remainingLedger}
        claimsCount={claims.length}
        underForecastDelta={underForecastDelta}
        utilizationPercent={utilizationPercent}
      />

      {/* Category Budget Sub-Caps Section */}
      <CategorySubCaps categories={categories} />

      {/* Dedicated Section: Event Focus 01: ACM Hackathon 2026 */}
      <EventVarianceSection />

      {/* Consolidated Expense Ledger Table Section */}
      <ExpenseLedgerTable
        claims={claims}
        onPreviewReceipt={handleOpenReceipt}
      />

      {/* Quick Receipt Preview Modal */}
      <ReceiptModal
        claim={selectedReceipt}
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
      />

      {/* New Expense Claim Modal */}
      <AddExpenseClaimModal
        open={addClaimModalOpen}
        onOpenChange={setAddClaimModalOpen}
        onAddClaim={handleAddClaim}
      />
    </div>
  );
}
