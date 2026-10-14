"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, FileCheck2, Files, MapPin, Plus, ShieldAlert, Users } from "lucide-react";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
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
    <span className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-blue-600 py-2 text-white">
      <span className="text-[11px] text-white/70">{p.month}</span>
      <span className="font-display text-2xl leading-none">{p.day}</span>
    </span>
  );
}

function EventRow({ event, href, action, extra }: { event: CampusEvent; href: string; action: string; extra?: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-2xl p-3 transition-colors duration-200 hover:bg-white/10"
      >
        <DateChip date={event.date} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-semibold text-ink group-hover:text-blue-200">{event.title}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatTime(event.startTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {event.venue}
            </span>
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

export function DashboardOverviewView({ initialEvents }: { initialEvents?: CampusEvent[] } = {}) {
  const { user, isAcmCore, canSeeConflicts, canAccessSubmissions } = useAuth();
  const eventList = initialEvents && initialEvents.length > 0 ? initialEvents : MOCK_EVENTS;
  const sorted = [...eventList].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  const upcoming = sorted.filter((e) => e.status === "approved").slice(0, 5);
  const pending = sorted.filter((e) => e.status === "pending").slice(0, 4);

  const conflicts = Object.values(MOCK_CONFLICTS).slice(0, 3);

  const activity = eventList.flatMap((e) => (e.reviews ?? []).map((r) => ({ ...r, eventTitle: e.title, eventId: e.id })))
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 5);

  const clubCounts = Object.entries(
    eventList.reduce<Record<string, number>>((acc, e) => {
      acc[e.club] = (acc[e.club] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const clubMax = Math.max(1, ...clubCounts.map(([, n]) => n));

  const stats = canSeeConflicts
    ? [
        { label: "Events this term", value: eventList.length, icon: CalendarDays },
        { label: "Waiting for review", value: eventList.filter((e) => e.status === "pending").length, icon: FileCheck2 },
        {
          label: "Events with conflicts",
          value: eventList.filter((e) => e.conflictSeverity === "high" || e.conflictSeverity === "critical").length,
          icon: ShieldAlert,
        },
      ]
    : [
        { label: "Events this term", value: eventList.length, icon: CalendarDays },
        { label: "Approved events", value: upcoming.length, icon: CalendarDays },
        { label: "Active campus clubs", value: clubCounts.length, icon: Users },
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
          canSeeConflicts
            ? "Here is what is happening across campus this term."
            : "Submit events and explore what is happening across campus."
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/calendar">
              <CalendarDays /> Open calendar
            </Link>
          </Button>
        }
      />

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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-3 sm:p-4">
            <SectionHeading
              className="px-3 pb-2 pt-2"
              title="Upcoming events"
              action={
                <Button asChild variant="link" size="sm">
                  <Link href="/calendar">View all</Link>
                </Button>
              }
            />
            {upcoming.length ? (
              <ul>
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} href={`/events/${e.id}`} action="Details" />
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CalendarDays />} title="No upcoming events" description="Approved events will show up here." />
            )}
          </Card>

          {isAcmCore && (
            <Card className="p-3 sm:p-4">
              <SectionHeading
                className="px-3 pb-2 pt-2"
                title="Waiting for review"
                action={
                  <Button asChild variant="link" size="sm">
                    <Link href="/verification">Open queue</Link>
                  </Button>
                }
              />
              {pending.length ? (
                <ul>
                  {pending.map((e) => (
                    <EventRow
                      key={e.id}
                      event={e}
                      href={`/verification/${e.id}`}
                      action="Review"
                      extra={e.conflictSeverity !== "none" ? <SeverityBadge severity={e.conflictSeverity} className="hidden md:inline-flex" /> : null}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<FileCheck2 />} title="All caught up" description="No events are waiting for review." />
              )}
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <SectionHeading title="Recent activity" />
            {activity.length ? (
              <ol className="relative mt-5 space-y-5 border-l border-white/12 pl-6">
                {activity.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[1.9rem] top-1.5 size-3 rounded-full bg-blue-400 ring-4 ring-[#0b1330]" />
                    <p className="text-sm leading-relaxed text-body">
                      <span className="font-semibold text-ink">{a.reviewerName}</span> {VERB[a.decision] ?? "updated"}{" "}
                      <Link href={`/events/${a.eventId}`} className="font-medium text-blue-300 hover:text-blue-200">
                        {a.eventTitle}
                      </Link>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">{a.comment}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon={<Clock />} title="No activity yet" description="Reviews and decisions will appear here." />
            )}
          </Card>
        </div>

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
            <SectionHeading title="Venue bookings" action={<span className="text-sm text-muted">October</span>} />
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
                    <div className={`h-full rounded-full ${v.bar}`} style={{ width: `${v.load}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <SectionHeading title="Most active clubs" action={<Users className="size-4 text-muted" />} />
            <ul className="space-y-4">
              {clubCounts.map(([name, n]) => (
                <li key={name} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-ink">{name}</span>
                    <span className="shrink-0 text-muted">{n} {n === 1 ? "event" : "events"}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300" style={{ width: `${(n / clubMax) * 100}%` }} />
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
