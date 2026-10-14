"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  FileCheck2,
  Files,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, SectionHeading } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/auth/auth-context";
import { cn, eventDateParts, formatTime } from "@/lib/utils";
import type { CampusEvent } from "@/lib/types/event";

const VENUE_LOAD = [
  { name: "LT-2", load: 75, note: "Busy", bar: "bg-amber-500" },
  { name: "Main Auditorium A", load: 90, note: "Almost full", bar: "bg-rose-500" },
  { name: "Turing Seminar Hall", load: 30, note: "Plenty of space", bar: "bg-emerald-500" },
  { name: "Computing Lab 3", load: 45, note: "Moderate", bar: "bg-blue-400" },
];

const QUICK = [
  { title: "Submit an event", text: "Start a new submission", href: "/events/new", icon: Plus },
  { title: "Campus calendar", text: "See every event", href: "/calendar", icon: CalendarDays },
  { title: "My submissions", text: "Track your events", href: "/events/my-submissions", icon: Files },
  { title: "Review queue", text: "Decide on pending events", href: "/verification", icon: FileCheck2 },
];

const VERB: Record<string, string> = {
  approved: "approved",
  changes_requested: "asked for changes on",
  rejected: "rejected",
  submitted: "submitted",
};

function DateChip({ date }: { date: string }) {
  const p = eventDateParts(date);
  return (
    <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-blue-600 py-2 text-white shadow-sm">
      <span className="text-[11px] font-medium text-white/80">{p.month}</span>
      <span className="font-display text-2xl font-semibold leading-none">{p.day}</span>
    </span>
  );
}

function EventRow({
  event,
  href,
  action,
  extra,
}: {
  event: CampusEvent;
  href: string;
  action: string;
  extra?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-2xl p-3 transition-colors duration-200 hover:bg-white/10"
      >
        <DateChip date={event.date} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-ink group-hover:text-blue-200">{event.title}</p>
            <StatusBadge status={event.status} />
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {event.venue}
            </span>
            {event.organizer && (
              <span className="text-blue-300/80">
                by {event.organizer}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {extra}
          <span className="hidden items-center gap-1 text-sm font-medium text-blue-300 sm:inline-flex">
            {action}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </li>
  );
}

type MainTab = "upcoming" | "my_submissions" | "pending" | "all";

export function DashboardOverviewView({ initialEvents }: { initialEvents?: CampusEvent[] } = {}) {
  const { user, isAcmCore, canSeeConflicts, canAccessSubmissions } = useAuth();

  const [events, setEvents] = useState<CampusEvent[]>(
    initialEvents && initialEvents.length > 0 ? initialEvents : MOCK_EVENTS
  );
  const [activeTab, setActiveTab] = useState<MainTab>("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  // Client-side fetch to ensure live fresh events from Neon DB
  const refreshEvents = useCallback(() => {
    setRefreshing(true);
    fetch(`/api/events/campus?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setEvents(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, []);

  // Sync state if initialEvents prop updates from RSC
  useEffect(() => {
    if (initialEvents && Array.isArray(initialEvents) && initialEvents.length > 0) {
      setEvents(initialEvents);
    }
  }, [initialEvents]);

  // Live polling every 3 seconds + window focus + storage event triggers
  useEffect(() => {
    refreshEvents();

    const timer = setInterval(() => {
      refreshEvents();
    }, 3000);

    const onFocus = () => refreshEvents();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "acm_event_created") {
        refreshEvents();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshEvents]);

  // User's own submissions
  const mySubmissions = useMemo(() => {
    const userEmail = (user?.email || "").toLowerCase().trim();
    const userName = (user?.name || "").toLowerCase().trim();

    return events
      .filter((e) => {
        if (!userEmail && !userName) return false;
        const eEmail = (e.submitterEmail || "").toLowerCase().trim();
        const eName = (e.submitterName || "").toLowerCase().trim();
        const eOrg = (e.organizer || "").toLowerCase().trim();

        const matchesEmail = Boolean(userEmail && eEmail && (eEmail === userEmail || eEmail.includes(userEmail) || userEmail.includes(eEmail)));
        const matchesName = Boolean(userName && eName && (eName === userName || eName.includes(userName) || userName.includes(eName)));
        const matchesOrg = Boolean(userName && eOrg && (eOrg === userName || eOrg.includes(userName) || userName.includes(eOrg)));

        return matchesEmail || matchesName || matchesOrg;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [events, user]);

  // Default active tab to my_submissions if user has submissions and is not ACM Core
  useEffect(() => {
    if (mySubmissions.length > 0 && !isAcmCore) {
      setActiveTab("my_submissions");
    }
  }, [mySubmissions.length, isAcmCore]);

  // Upcoming approved events
  const upcomingApproved = useMemo(() => {
    return events
      .filter((e) => e.status === "approved")
      .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  }, [events]);

  // Pending queue waiting for review (sorted by latest submission first)
  const pendingQueue = useMemo(() => {
    return events
      .filter((e) => e.status === "pending")
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [events]);

  // All recent submissions
  const allSubmissions = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [events]);

  const conflicts = Object.values(MOCK_CONFLICTS).slice(0, 3);

  const activity = events
    .flatMap((e) => (e.reviews ?? []).map((r) => ({ ...r, eventTitle: e.title, eventId: e.id })))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 5);

  const clubCounts = Object.entries(
    events.reduce<Record<string, number>>((acc, e) => {
      acc[e.club] = (acc[e.club] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const clubMax = Math.max(1, ...clubCounts.map(([, n]) => n));

  const stats = [
    { label: "Total Campus Events", value: events.length, icon: CalendarDays },
    {
      label: "Waiting for Review",
      value: pendingQueue.length,
      icon: FileCheck2,
    },
    {
      label: "Your Submissions",
      value: mySubmissions.length,
      icon: Files,
    },
  ];

  const quickLinks = QUICK.filter((item) => {
    if (item.href === "/verification" && !isAcmCore) return false;
    if (item.href === "/events/my-submissions" && !canAccessSubmissions) return false;
    return true;
  });

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={
          isAcmCore
            ? "Review submissions, detect scheduling overlaps, and manage the campus calendar."
            : "Submit events, track approval status, and view the campus schedule."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshEvents}
              disabled={refreshing}
              className="gap-2 text-xs"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button asChild size="sm">
              <Link href="/events/new">
                <Plus className="size-4" /> Submit Event
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Counter */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-400/15 text-blue-300">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-display text-3xl font-medium leading-none text-ink">{value}</p>
              <p className="mt-1.5 text-sm text-muted">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Action Links */}
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          quickLinks.length === 4
            ? "lg:grid-cols-4"
            : quickLinks.length === 3
            ? "lg:grid-cols-3"
            : "lg:grid-cols-2"
        )}
      >
        {quickLinks.map(({ title, text, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="glass group flex items-center gap-3.5 rounded-[var(--radius-panel)] p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-blue-400/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white">
              <Icon className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{title}</span>
              <span className="block truncate text-xs text-muted">{text}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Main Events Area */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Prominent "Your Submissions" Card for Current User */}
          {mySubmissions.length > 0 && (
            <Card className="p-4 sm:p-5 border-blue-500/25 bg-blue-950/10">
              <div className="flex items-center justify-between pb-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                    <Sparkles className="size-3.5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink text-base">Your Submissions</h3>
                    <p className="text-xs text-muted">
                      Events you have submitted ({mySubmissions.length})
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link href="/events/my-submissions">View all</Link>
                </Button>
              </div>

              <ul className="divide-y divide-white/5 pt-2">
                {mySubmissions.slice(0, 4).map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    href={`/events/${e.id}`}
                    action="Details"
                    extra={
                      e.conflictSeverity !== "none" ? (
                        <SeverityBadge
                          severity={e.conflictSeverity}
                          className="hidden md:inline-flex"
                        />
                      ) : null
                    }
                  />
                ))}
              </ul>
            </Card>
          )}

          {/* Campus Events Section with Filter Tabs */}
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 pb-3 pt-2 border-b border-white/8">
              <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/8">
                <button
                  type="button"
                  onClick={() => setActiveTab("upcoming")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    activeTab === "upcoming"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted hover:text-ink"
                  )}
                >
                  Upcoming Approved ({upcomingApproved.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pending")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    activeTab === "pending"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted hover:text-ink"
                  )}
                >
                  In Review ({pendingQueue.length})
                </button>
                {mySubmissions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("my_submissions")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      activeTab === "my_submissions"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-muted hover:text-ink"
                    )}
                  >
                    My Submissions ({mySubmissions.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    activeTab === "all"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted hover:text-ink"
                  )}
                >
                  All ({events.length})
                </button>
              </div>

              <Button asChild variant="link" size="sm" className="text-xs">
                <Link href="/calendar">Open full calendar</Link>
              </Button>
            </div>

            {/* Tab: My Submissions */}
            {activeTab === "my_submissions" && (
              <div className="pt-2">
                {mySubmissions.length ? (
                  <ul className="divide-y divide-white/5">
                    {mySubmissions.map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        href={`/events/${e.id}`}
                        action="Details"
                        extra={
                          e.conflictSeverity !== "none" ? (
                            <SeverityBadge
                              severity={e.conflictSeverity}
                              className="hidden md:inline-flex"
                            />
                          ) : null
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<Files />}
                    title="No submissions yet"
                    description="Events you submit will appear here."
                  />
                )}
              </div>
            )}

            {/* Tab 1: Upcoming Approved */}
            {activeTab === "upcoming" && (
              <div className="pt-2">
                {upcomingApproved.length ? (
                  <ul className="divide-y divide-white/5">
                    {upcomingApproved.slice(0, 5).map((e) => (
                      <EventRow key={e.id} event={e} href={`/events/${e.id}`} action="Details" />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<CalendarDays />}
                    title="No upcoming approved events"
                    description="Approved events will appear here."
                  />
                )}
              </div>
            )}

            {/* Tab 2: In Review / Pending */}
            {activeTab === "pending" && (
              <div className="pt-2">
                {pendingQueue.length ? (
                  <ul className="divide-y divide-white/5">
                    {pendingQueue.slice(0, 6).map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        href={isAcmCore ? `/verification/${e.id}` : `/events/${e.id}`}
                        action={isAcmCore ? "Review" : "Details"}
                        extra={
                          e.conflictSeverity !== "none" ? (
                            <SeverityBadge
                              severity={e.conflictSeverity}
                              className="hidden md:inline-flex"
                            />
                          ) : null
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<FileCheck2 />}
                    title="Queue is clear"
                    description="No events are waiting for review."
                  />
                )}
              </div>
            )}

            {/* Tab 3: All Events */}
            {activeTab === "all" && (
              <div className="pt-2">
                {allSubmissions.length ? (
                  <ul className="divide-y divide-white/5">
                    {allSubmissions.slice(0, 7).map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        href={`/events/${e.id}`}
                        action="Details"
                        extra={
                          e.conflictSeverity !== "none" ? (
                            <SeverityBadge
                              severity={e.conflictSeverity}
                              className="hidden md:inline-flex"
                            />
                          ) : null
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<CalendarDays />}
                    title="No events found"
                    description="Submit a new event to get started."
                  />
                )}
              </div>
            )}
          </Card>

          {/* Waiting for Review Section (For ACM Core Reviewers) */}
          {isAcmCore && pendingQueue.length > 0 && activeTab !== "pending" && (
            <Card className="p-3 sm:p-4">
              <SectionHeading
                className="px-3 pb-2 pt-2"
                title="Waiting for review"
                action={
                  <Button asChild variant="link" size="sm">
                    <Link href="/verification">Open review queue ({pendingQueue.length})</Link>
                  </Button>
                }
              />
              <ul className="divide-y divide-white/5">
                {pendingQueue.slice(0, 4).map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    href={`/verification/${e.id}`}
                    action="Review"
                    extra={
                      e.conflictSeverity !== "none" ? (
                        <SeverityBadge
                          severity={e.conflictSeverity}
                          className="hidden md:inline-flex"
                        />
                      ) : null
                    }
                  />
                ))}
              </ul>
            </Card>
          )}

          {/* Recent Activity */}
          <Card className="p-5 sm:p-6">
            <SectionHeading title="Recent activity" />
            {activity.length ? (
              <ol className="relative mt-5 space-y-5 border-l border-white/12 pl-6">
                {activity.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full bg-blue-400 ring-4 ring-[#0b1330]" />
                    <p className="text-sm leading-relaxed text-body">
                      <span className="font-semibold text-ink">{a.reviewerName}</span>{" "}
                      {VERB[a.decision] ?? "updated"}{" "}
                      <Link
                        href={`/events/${a.eventId}`}
                        className="font-medium text-blue-300 hover:text-blue-200"
                      >
                        {a.eventTitle}
                      </Link>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{a.comment}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                icon={<Clock />}
                title="No activity yet"
                description="Reviews and decisions will appear here."
              />
            )}
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {canSeeConflicts && (
            <Card className="space-y-4 p-5 sm:p-6">
              <SectionHeading title="Conflicts to look at" />
              <ul className="space-y-3">
                {conflicts.map((c) => (
                  <li key={c.id} className="glass-inset space-y-2.5 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity={c.severity} />
                      <span className="text-xs text-muted">
                        {c.overlapMinutes > 0 ? `${c.overlapMinutes} min overlap` : "Capacity"}
                      </span>
                    </div>
                    <p className="font-semibold leading-snug text-ink">{c.headline}</p>
                    <p className="line-clamp-1 text-sm text-muted">{c.yourEvent.title}</p>
                    <Link
                      href={`/events/${c.targetEventId}/conflicts`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-300 hover:text-white"
                    >
                      See details <ArrowRight className="size-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="space-y-5 p-5 sm:p-6">
            <SectionHeading
              title="Venue bookings"
              action={<span className="text-sm text-muted">October</span>}
            />
            <ul className="space-y-4">
              {VENUE_LOAD.map((v) => (
                <li key={v.name} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-ink">{v.name}</span>
                    <span className="text-muted">
                      {v.load}% · {v.note}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white/8"
                    role="progressbar"
                    aria-label={`${v.name} bookings`}
                    aria-valuenow={v.load}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full ${v.bar}`}
                      style={{ width: `${v.load}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <SectionHeading
              title="Most active clubs"
              action={<Users className="size-4 text-muted" />}
            />
            <ul className="space-y-4">
              {clubCounts.map(([name, n]) => (
                <li key={name} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-ink">{name}</span>
                    <span className="shrink-0 text-muted">
                      {n} {n === 1 ? "event" : "events"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300"
                      style={{ width: `${(n / clubMax) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
