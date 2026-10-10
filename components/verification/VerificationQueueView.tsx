"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Inbox, Search, SlidersHorizontal } from "lucide-react";
import { MOCK_VERIFICATION_QUEUE, MOCK_VERIFICATION_STATS } from "@/lib/mock/verification";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatDate, formatTime } from "@/lib/utils";

type Tab = "all" | "pending" | "conflicts" | "changes";

export function VerificationQueueView() {
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const s = MOCK_VERIFICATION_STATS;

  const rows = MOCK_VERIFICATION_QUEUE.filter(({ event }) => {
    const q = query.trim().toLowerCase();
    if (q && ![event.title, event.organizer, event.venue].some((t) => t.toLowerCase().includes(q))) return false;
    if (tab === "pending") return event.status === "pending";
    if (tab === "conflicts") return event.conflictSeverity === "critical" || event.conflictSeverity === "high";
    if (tab === "changes") return event.status === "changes_requested";
    return true;
  });

  const cards = [
    { id: "pending" as const, label: "Waiting for review", value: s.pendingCount, icon: Clock, hint: "Not reviewed yet" },
    { id: "conflicts" as const, label: "Serious conflicts", value: s.highConflictsCount, icon: AlertTriangle, hint: "Venue or time overlaps" },
    { id: "changes" as const, label: "Changes requested", value: s.changesRequestedCount, icon: SlidersHorizontal, hint: "Waiting on organizers" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Review queue" description="Check proposed events before they go on the campus calendar." />

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ id, label, value, icon: Icon, hint }) => {
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setTab(id)}
              className={cn(
                "glass flex cursor-pointer items-center gap-4 rounded-[var(--radius-panel)] p-5 text-left transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5",
                on && "border-blue-400 shadow-[0_0_0_3px_rgba(79,115,180,0.2),var(--shadow-glass)]"
              )}
            >
              <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", on ? "bg-blue-600 text-white" : "bg-blue-400/15 text-blue-300")}>
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-display text-3xl font-medium leading-none text-ink">{value}</span>
                <span className="mt-1.5 block text-sm font-medium text-ink">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="min-w-0">
          <TabsList aria-label="Filter queue">
            <TabsTrigger value="all">All <span className="text-xs opacity-70">{MOCK_VERIFICATION_QUEUE.length}</span></TabsTrigger>
            <TabsTrigger value="pending">Waiting <span className="text-xs opacity-70">{s.pendingCount}</span></TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts <span className="text-xs opacity-70">{s.highConflictsCount}</span></TabsTrigger>
            <TabsTrigger value="changes">Changes <span className="text-xs opacity-70">{s.changesRequestedCount}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search event, host or venue" aria-label="Search queue" className="pl-10" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Event</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Conflicts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7}>
                  <EmptyState icon={<Inbox />} title="Nothing here" description="No events match this filter." />
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ event }) => {
                const urgent = event.conflictSeverity === "high" || event.conflictSeverity === "critical";
                return (
                  <TableRow key={event.id}>
                    <TableCell className="max-w-xs">
                      <Link href={`/verification/${event.id}`} className="font-semibold leading-snug text-ink hover:text-blue-200">
                        {event.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{event.eventType}</p>
                    </TableCell>
                    <TableCell className="max-w-[12rem]">{event.organizer}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-ink">{formatDate(event.date)}</p>
                      <p className="text-xs text-muted">{formatTime(event.startTime)} – {formatTime(event.endTime)}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{event.venue}</TableCell>
                    <TableCell><SeverityBadge severity={event.conflictSeverity} /></TableCell>
                    <TableCell><StatusBadge status={event.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant={urgent ? "default" : "outline"}>
                        <Link href={`/verification/${event.id}`}>
                          Review <ArrowRight />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
