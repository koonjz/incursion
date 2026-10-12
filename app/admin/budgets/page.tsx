"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PieChart, Plus, DollarSign, TrendingUp, AlertCircle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BudgetRecord {
  id: string;
  semesterId: string;
  department: string;
  allocated: number;
  spent: number;
  currency: string;
  adminOverride: boolean;
  notes: string | null;
}

interface BudgetAnalytics {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationPercentage: number;
}

interface ChartItem {
  department: string;
  allocated: number;
  spent: number;
  remaining: number;
  utilization: number;
}

interface SemesterOption {
  id: string;
  name: string;
  isActive: boolean;
}

export default function AdminBudgetsPage() {
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [summary, setSummary] = useState<BudgetAnalytics>({
    totalAllocated: 0,
    totalSpent: 0,
    totalRemaining: 0,
    utilizationPercentage: 0,
  });
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form states
  const [department, setDepartment] = useState("");
  const [allocated, setAllocated] = useState("");
  const [spent, setSpent] = useState("0");
  const [adminOverride, setAdminOverride] = useState(false);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Fetch available semesters for dropdown
  useEffect(() => {
    async function loadSemesters() {
      try {
        const res = await fetch("/api/admin/semesters");
        const json = await res.json();
        if (json.success && json.data) {
          setSemesters(json.data);
          const active = json.data.find((s: SemesterOption) => s.isActive);
          if (active) {
            setSelectedSemester(active.id);
          } else if (json.data.length > 0) {
            setSelectedSemester(json.data[0].id);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadSemesters();
  }, []);

  // 2. Fetch budgets for the selected semester
  const fetchBudgets = useCallback(async (semId: string) => {
    if (!semId) return;
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/admin/budgets?semesterId=${encodeURIComponent(semId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBudgets(json.data.budgets || []);
        setSummary(json.data.summary);
        setChartData(json.data.chartData || []);
      } else {
        setErrorBanner(json.error?.message || "Failed to load department budgets");
      }
    } catch {
      setErrorBanner("Network error while loading budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      fetchBudgets(selectedSemester);
    }
  }, [selectedSemester, fetchBudgets]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrorBanner(null);
    setSuccessBanner(null);

    const allocNum = parseFloat(allocated);
    const spentNum = parseFloat(spent || "0");

    if (!department || isNaN(allocNum)) {
      setFormError("Department name and allocated amount are required");
      return;
    }

    if (!adminOverride && spentNum > allocNum) {
      setFormError("Spent amount exceeds allocated budget. Enable the Admin Override flag to authorize this allocation.");
      return;
    }

    try {
      const res = await fetch("/api/admin/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: selectedSemester,
          department,
          allocated: allocNum,
          spent: spentNum,
          adminOverride,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Budget allocation for ${department} created successfully.`);
        setDepartment("");
        setAllocated("");
        setSpent("0");
        setAdminOverride(false);
        setNotes("");
        setShowAddForm(false);
        fetchBudgets(selectedSemester);
      } else {
        setFormError(data.error?.message || "Failed to create budget");
      }
    } catch {
      setFormError("Network error while creating budget");
    }
  };

  const handleDeleteBudget = async (id: string, dept: string) => {
    if (!confirm(`Delete budget record for ${dept}?`)) return;
    setErrorBanner(null);
    setSuccessBanner(null);
    try {
      const res = await fetch(`/api/admin/budgets/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Budget for ${dept} deleted.`);
        fetchBudgets(selectedSemester);
      } else {
        setErrorBanner(data.error?.message || "Failed to delete budget");
      }
    } catch {
      setErrorBanner("An error occurred while deleting budget");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Department & Club Budgets</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track allocations, monitor expenditures, and maintain hard overspend limits per semester.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="h-9 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {semesters.length === 0 && <option value="">No semesters</option>}
            {semesters.map((s) => (
              <option key={s.id} value={s.id} className="bg-navy-950">
                {s.name} {s.isActive ? "(Active)" : ""}
              </option>
            ))}
          </select>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? "Cancel" : "Add Budget"}
          </Button>
        </div>
      </div>

      {errorBanner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorBanner}</span>
        </div>
      )}

      {successBanner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          <Check className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Allocated</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${summary.totalAllocated.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Spent</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">
                ${summary.totalSpent.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Remaining Balance</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                ${summary.totalRemaining.toLocaleString()}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Overall Utilization</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {summary.utilizationPercentage}%
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <PieChart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Budget Form Drawer */}
      {showAddForm && (
        <Card className="glass border-blue-500/30 bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base text-white">Create Department Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-slate-300 text-xs">Department / Club Name</Label>
                  <Input
                    id="department"
                    placeholder="e.g. ACM Student Chapter"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="allocated" className="text-slate-300 text-xs">Allocated Amount ($)</Label>
                  <Input
                    id="allocated"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="10000"
                    value={allocated}
                    onChange={(e) => setAllocated(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="spent" className="text-slate-300 text-xs">Initial Spent ($)</Label>
                  <Input
                    id="spent"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={spent}
                    onChange={(e) => setSpent(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-slate-300 text-xs">Allocation Notes & Justification</Label>
                <Input
                  id="notes"
                  placeholder="e.g. Approved by Dean of Students for annual technical summit"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adminOverride"
                  checked={adminOverride}
                  onChange={(e) => setAdminOverride(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <Label htmlFor="adminOverride" className="text-xs text-slate-300 cursor-pointer">
                  Admin Override: Allow spent amount to exceed allocated budget threshold
                </Label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                  Save Allocation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Visual Analytics / Breakdown Display */}
      <Card className="glass border-white/10">
        <CardHeader className="pb-3 border-b border-white/10">
          <CardTitle className="text-base text-white font-medium">Departmental Utilization Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {chartData.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No budget allocations recorded for this semester.
            </div>
          ) : (
            <div className="space-y-5">
              {chartData.map((item) => {
                const percent = Math.min(100, item.utilization);
                const isOverBudget = item.spent > item.allocated;

                return (
                  <div key={item.department} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white">{item.department}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">
                          ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()}
                        </span>
                        <span className={isOverBudget ? "text-red-400 font-semibold" : "text-slate-300"}>
                          {item.utilization}%
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full transition-all duration-500 rounded-full ${
                          isOverBudget
                            ? "bg-red-500"
                            : percent > 85
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budgets Table */}
      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-base text-white font-medium">Allocations Ledger</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Department / Club</th>
                <th className="px-6 py-3">Allocated</th>
                <th className="px-6 py-3">Spent</th>
                <th className="px-6 py-3">Remaining</th>
                <th className="px-6 py-3">Override</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading allocations...
                  </td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No budget allocations recorded for this semester.
                  </td>
                </tr>
              ) : (
                budgets.map((b) => {
                  const remaining = Math.max(0, b.allocated - b.spent);
                  const isOver = b.spent > b.allocated;

                  return (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{b.department}</div>
                        {b.notes && <div className="text-xs text-slate-400 truncate max-w-xs">{b.notes}</div>}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        ${b.allocated.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 font-medium ${isOver ? "text-red-400" : "text-amber-400"}`}>
                        ${b.spent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-emerald-400">
                        ${remaining.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {b.adminOverride ? (
                          <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/10">
                            Override
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-500">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBudget(b.id, b.department)}
                          className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
