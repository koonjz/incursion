"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Edit, Eye, FileText, Plus, Search } from "lucide-react";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatTime } from "@/lib/utils";
import type { EventStatus } from "@/lib/types/event";

type Tab = "all" | EventStatus;

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "pending", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "rejected", label: "Rejected" },
];

export function MySubmissionsView() {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: MOCK_EVENTS.length };
    for (const e of MOCK_EVENTS) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, []);

  const rows = MOCK_EVENTS.filter((e) => {
    const q = query.trim().toLowerCase();
    if (q && !e.title.toLowerCase().includes(q) && !e.venue.toLowerCase().includes(q)) return false;
    return tab === "all" || e.status === tab;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My submissions"
        description="Track your events, see review status and fix conflicts."
        actions={
          <Button asChild>
            <Link href="/events/new">
              <Plus /> Submit event
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="min-w-0">
          <TabsList aria-label="Filter by status">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <span className="text-xs opacity-70">{counts[t.value] ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or venue"
            aria-label="Search submissions"
            className="pl-10"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Conflicts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={<FileText />}
                    title="No events found"
                    description="Try another status or clear your search."
                    action={
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => {
                          setTab("all");
                          setQuery("");
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="max-w-xs">
                    <Link href={`/events/${e.id}`} className="font-semibold leading-snug text-ink hover:text-blue-200">
                      {e.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">{e.eventType}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <p className="text-ink">{formatDate(e.date)}</p>
                    <p className="text-xs text-muted">
                      {formatTime(e.startTime)} – {formatTime(e.endTime)}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{e.venue}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={e.conflictSeverity} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/events/${e.id}`}>
                          <Eye /> View
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/events/${e.id}/edit`}>
                          <Edit /> {e.status === "draft" ? "Continue" : "Edit"}
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
