import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Users, CalendarRange, PieChart, Shield, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Admin Console | ACM Resolve",
  description: "Campus administration, user roles, semester schedules, and budgets.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 glass-strong border-b md:border-b-0 md:border-r border-white/10 flex flex-col p-4 md:p-6 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-white tracking-tight">Admin Console</span>
            <p className="text-xs text-slate-400">Campus Oversight</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          <Link href="/admin/users">
            <span className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <Users className="h-4 w-4 text-blue-400" />
              Users & Roles
            </span>
          </Link>

          <Link href="/admin/semesters">
            <span className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <CalendarRange className="h-4 w-4 text-emerald-400" />
              Semester Lifecycle
            </span>
          </Link>

          <Link href="/admin/budgets">
            <span className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <PieChart className="h-4 w-4 text-amber-400" />
              Department Budgets
            </span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-white/10 flex flex-col gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-white/5 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Main Dashboard
            </Button>
          </Link>
          <div className="px-3 text-xs text-slate-500">
            Role: <span className="text-blue-400 font-semibold">ADMIN</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 glass border-b border-white/10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">Campus</Link>
            <span>/</span>
            <span className="text-white font-medium">Administration</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              System Active
            </span>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
