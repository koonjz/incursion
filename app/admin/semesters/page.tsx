"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, parseISO, isAfter } from "date-fns";
import { CalendarRange, Plus, CheckCircle, Archive, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isArchived: boolean;
  budgetCount?: number;
}

export default function AdminSemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSemesters = useCallback(async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await fetch("/api/admin/semesters");
      const json = await res.json();
      if (json.success) {
        setSemesters(json.data || []);
      } else {
        setErrorBanner(json.error?.message || "Failed to load semesters");
      }
    } catch {
      setErrorBanner("Network error while loading semesters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!name || !startDate || !endDate) {
      setFormError("All fields are required");
      return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isAfter(end, start)) {
      setFormError("End date must be strictly after the start date");
      return;
    }

    try {
      const res = await fetch("/api/admin/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate, isActive }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Semester '${name}' created successfully`);
        setName("");
        setStartDate("");
        setEndDate("");
        setIsActive(false);
        setShowAddForm(false);
        fetchSemesters();
      } else {
        setFormError(data.error?.message || "Failed to create semester");
      }
    } catch {
      setFormError("Network error while creating semester");
    }
  };

  const handleActivate = async (id: string, semName: string) => {
    setErrorBanner(null);
    setSuccessBanner(null);
    try {
      const res = await fetch(`/api/admin/semesters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Semester '${semName}' is now the active campus semester.`);
        fetchSemesters();
      } else {
        setErrorBanner(data.error?.message || "Failed to switch active semester");
      }
    } catch {
      setErrorBanner("An error occurred during semester activation");
    }
  };

  const handleArchive = async (id: string, semName: string) => {
    setErrorBanner(null);
    setSuccessBanner(null);
    try {
      const res = await fetch(`/api/admin/semesters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Semester '${semName}' archived.`);
        fetchSemesters();
      } else {
        setErrorBanner(data.error?.message || "Failed to archive semester");
      }
    } catch {
      setErrorBanner("An error occurred while archiving semester");
    }
  };

  const handleDelete = async (id: string, semName: string) => {
    if (!confirm(`Are you sure you want to delete semester '${semName}'?`)) return;
    setErrorBanner(null);
    setSuccessBanner(null);
    try {
      const res = await fetch(`/api/admin/semesters/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Semester '${semName}' deleted.`);
        fetchSemesters();
      } else {
        setErrorBanner(data.error?.message || "Failed to delete semester");
      }
    } catch {
      setErrorBanner("An error occurred while deleting semester");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Semester Lifecycle</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure academic periods, maintain active terms, and enforce zero date overlap.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? "Cancel" : "Add Semester"}
        </Button>
      </div>

      {errorBanner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorBanner}</span>
        </div>
      )}

      {successBanner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Add Semester Form Drawer */}
      {showAddForm && (
        <Card className="glass border-blue-500/30 bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base text-white">Create New Academic Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSemester} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-300 text-xs">Semester Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Spring 2027"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-slate-300 text-xs">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-slate-300 text-xs">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <Label htmlFor="isActive" className="text-xs text-slate-300 cursor-pointer">
                  Set as immediately Active (transactionally deactivates any existing active semester)
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
                  Save Semester
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Semesters List */}
      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-base text-white font-medium">Configured Semesters</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Semester</th>
                <th className="px-6 py-3">Date Window</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Budgets</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading semesters...
                  </td>
                </tr>
              ) : semesters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No semesters configured yet. Click &quot;Add Semester&quot; above to create one.
                  </td>
                </tr>
              ) : (
                semesters.map((s) => {
                  let formattedWindow = "Dates unavailable";
                  try {
                    formattedWindow = `${format(parseISO(s.startDate), "MMM d, yyyy")} — ${format(parseISO(s.endDate), "MMM d, yyyy")}`;
                  } catch {
                    // Fallback
                  }

                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-slate-400 shrink-0" />
                        {s.name}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {formattedWindow}
                      </td>
                      <td className="px-6 py-4">
                        {s.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Active Term
                          </Badge>
                        ) : s.isArchived ? (
                          <Badge variant="outline" className="text-slate-500 border-slate-700">
                            Archived
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-white/10">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {s.budgetCount !== undefined ? `${s.budgetCount} allocations` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!s.isActive && !s.isArchived && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(s.id, s.name)}
                              className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Activate
                            </Button>
                          )}

                          {!s.isArchived && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(s.id, s.name)}
                              className="h-8 px-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 gap-1"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s.id, s.name)}
                            className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
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
