"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  CloudCheck,
  MoreVertical,
  ReceiptText,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { ExpenseCategory, ExpenseClaim } from "@/lib/types/expenses";

interface ExpenseLedgerTableProps {
  claims: ExpenseClaim[];
  onPreviewReceipt: (claim: ExpenseClaim) => void;
}

export function ExpenseLedgerTable({
  claims,
  onPreviewReceipt,
}: ExpenseLedgerTableProps) {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All Events");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = claims.filter((c) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      ![
        c.description,
        c.event,
        c.category,
        c.merchant,
        c.addedBy.name,
        c.receiptName,
      ].some((t) => t.toLowerCase().includes(q))
    ) {
      return false;
    }

    if (eventFilter !== "All Events" && c.event !== eventFilter) {
      return false;
    }

    if (statusFilter === "Approved & Audited" && c.status !== "approved") {
      return false;
    }
    if (statusFilter === "Pending Audit" && c.status !== "pending") {
      return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentClaims = filtered.slice((page - 1) * pageSize, page * pageSize);

  const formatINR = (val: number) => "₹" + val.toLocaleString("en-IN");

  const getCategoryBadgeClass = (category: ExpenseCategory) => {
    switch (category) {
      case "Food & Catering":
        return "bg-amber-500/15 text-amber-300 border-amber-500/25";
      case "Equipment & Hardware":
        return "bg-blue-500/15 text-blue-300 border-blue-500/25";
      case "Marketing & Swag":
        return "bg-purple-500/15 text-purple-300 border-purple-500/25";
      case "Transportation":
        return "bg-cyan-500/15 text-cyan-300 border-cyan-500/25";
      case "Venue & Audio":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
      case "Printing & Certificates":
        return "bg-rose-500/15 text-rose-300 border-rose-500/25";
      default:
        return "bg-white/10 text-body border-white/10";
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20">
              <ReceiptText className="size-4" />
            </span>
            <h2 className="font-display text-2xl font-medium text-ink">
              All Expense Records
            </h2>
          </div>
          <p className="text-xs text-muted">
            List of bills and payments approved by the club team.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-9 text-xs"
            />
          </div>

          <select
            value={eventFilter}
            onChange={(e) => {
              setEventFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All Events" className="bg-navy-950 text-white">All Events</option>
            <option value="ACM Hackathon 2026" className="bg-navy-950 text-white">ACM Hackathon 2026</option>
            <option value="CodeClash Monthly" className="bg-navy-950 text-white">CodeClash Monthly</option>
            <option value="AI Research Conclave" className="bg-navy-950 text-white">AI Research Conclave</option>
            <option value="ACM Technical Workshop" className="bg-navy-950 text-white">ACM Technical Workshop</option>
            <option value="General Chapter Ops" className="bg-navy-950 text-white">General Chapter Ops</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All Statuses" className="bg-navy-950 text-white">All Statuses</option>
            <option value="Approved & Audited" className="bg-navy-950 text-white">Approved</option>
            <option value="Pending Audit" className="bg-navy-950 text-white">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Ledger Table Container */}
      <Card className="glass overflow-hidden border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/10 bg-white/[0.02]">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Event</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Description</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Amount</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Receipt</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Added By</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted">
                  No expenses found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              currentClaims.map((claim) => (
                <TableRow key={claim.id} className="transition-colors hover:bg-white/[0.03]">
                  {/* Date */}
                  <TableCell className="whitespace-nowrap text-xs font-mono text-muted">
                    {formatDate(claim.date)}
                  </TableCell>

                  {/* Associated Event */}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-xs font-semibold text-ink">{claim.event}</span>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${getCategoryBadgeClass(
                        claim.category
                      )}`}
                    >
                      {claim.category}
                    </span>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="max-w-xs truncate text-xs text-body" title={claim.description}>
                    {claim.description}
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="whitespace-nowrap text-right font-display text-base font-bold text-ink">
                    {formatINR(claim.amount)}
                  </TableCell>

                  {/* Receipt Proof */}
                  <TableCell className="whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onPreviewReceipt(claim)}
                      className="glass-inset inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-body hover:text-ink hover:border-blue-400/40 transition-colors cursor-pointer"
                    >
                      <CloudCheck className="size-3.5 text-blue-400" />
                      <span>{claim.receiptName}</span>
                    </button>
                  </TableCell>

                  {/* Added By */}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/15 text-[10px] font-bold text-blue-300 ring-1 ring-blue-500/25">
                        {claim.addedBy.initials}
                      </span>
                      <span className="text-xs text-ink font-medium">{claim.addedBy.name}</span>
                    </div>
                  </TableCell>

                  {/* Audit Status */}
                  <TableCell className="whitespace-nowrap">
                    {claim.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 className="size-3" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        <Clock className="size-3" /> Pending Review
                      </span>
                    )}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => onPreviewReceipt(claim)}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-white/6 transition-colors"
                      title="View Details"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 bg-white/[0.01] text-xs text-muted">
          <span>
            Showing {currentClaims.length} of {filtered.length} expense records
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-8 px-3"
            >
              Previous
            </Button>
            <span className="font-medium text-ink px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs h-8 px-3"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
