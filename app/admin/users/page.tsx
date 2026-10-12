"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Shield, UserCheck, UserX, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "HOD" | "ORGANIZER" | "STUDENT";
  department?: string | null;
  isActive?: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        role: roleFilter,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data.users);
        setTotalPages(json.data.pagination.totalPages || 1);
      } else {
        setErrorBanner(json.error?.message || "Failed to load users");
      }
    } catch {
      setErrorBanner("Network error while loading user accounts");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setErrorBanner(null);
    setSuccessBanner(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Role updated to ${newRole}`);
        fetchUsers();
      } else {
        setErrorBanner(data.error?.message || "Failed to update user role");
      }
    } catch {
      setErrorBanner("An error occurred while updating user role");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setErrorBanner(null);
    setSuccessBanner(null);
    const newStatus = !currentStatus;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`User account ${newStatus ? "activated" : "deactivated"}`);
        fetchUsers();
      } else {
        setErrorBanner(data.error?.message || "Failed to toggle user status");
      }
    } catch {
      setErrorBanner("An error occurred while updating status");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "HOD":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "ORGANIZER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">User & Role Administration</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage campus accounts, permissions, and roles with full audit protection.
        </p>
      </div>

      {errorBanner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{errorBanner}</span>
        </div>
      )}

      {successBanner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          <Shield className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="glass border-white/10">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL" className="bg-navy-950">All Roles</option>
              <option value="ADMIN" className="bg-navy-950">ADMIN</option>
              <option value="HOD" className="bg-navy-950">HOD</option>
              <option value="ORGANIZER" className="bg-navy-950">ORGANIZER</option>
              <option value="STUDENT" className="bg-navy-950">VIEWER / STUDENT</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers()}
              className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-base text-white font-medium">Campus Users Directory</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading campus accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${getRoleBadgeVariant(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {u.department || "General"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={isActive ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-red-400 border-red-500/20 bg-red-500/10"}>
                          {isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="h-8 px-2 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="ADMIN" className="bg-navy-950">ADMIN</option>
                            <option value="HOD" className="bg-navy-950">HOD</option>
                            <option value="ORGANIZER" className="bg-navy-950">ORGANIZER</option>
                            <option value="STUDENT" className="bg-navy-950">STUDENT (VIEWER)</option>
                          </select>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(u.id, isActive)}
                            title={isActive ? "Deactivate User" : "Activate User"}
                            className={`h-8 px-2 text-xs gap-1 ${isActive ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"}`}
                          >
                            {isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            {isActive ? "Deactivate" : "Activate"}
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 text-xs border-white/10 text-slate-300 hover:bg-white/5"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 text-xs border-white/10 text-slate-300 hover:bg-white/5"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
