import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "403 Forbidden | ACM Resolve",
  description: "Access forbidden or insufficient privileges.",
};

export const dynamic = "force-dynamic";

export default function ForbiddenPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>;
}) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-navy-950" />}>
      <ForbiddenView searchParams={searchParams} />
    </React.Suspense>
  );
}

async function ForbiddenView({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const isDeactivated = resolvedParams?.reason === "deactivated";

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-12">
      <div className="relative max-w-md w-full glass-strong p-8 rounded-2xl border border-white/10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          {isDeactivated ? "Account Deactivated" : "403 — Access Forbidden"}
        </h1>

        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          {isDeactivated
            ? "Your campus account has been temporarily deactivated by an administrator. Please reach out to your department coordinator or IT administrator for assistance."
            : "You do not have the required administrative permissions to access this page or resource. Contact your campus administrator if you believe this is an error."}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 border-white/10 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>

          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="default" className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white">
              <LogOut className="h-4 w-4" />
              Sign in with another account
            </Button>
          </Link>
        </div>

        <div className="mt-6 border-t border-white/5 pt-4 text-xs text-slate-500">
          ACM Resolve Access Control &bull; Protected Campus Zone
        </div>
      </div>
    </div>
  );
}
