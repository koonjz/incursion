import React from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full gap-4 overflow-hidden p-3 sm:p-4">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col gap-4">
        <Header />
        <main id="main" className="min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-hero)] pr-1">
          <div className="mx-auto max-w-6xl px-1 pb-10 pt-2 sm:px-2">{children}</div>
        </main>
      </div>
    </div>
  );
}
