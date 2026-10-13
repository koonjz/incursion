"use client";

import React from "react";
import Link from "next/link";
import { Building2, CalendarDays, Clock, Edit, Mail, MapPin, ShieldAlert, User, Users } from "lucide-react";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
import { ConflictSummary } from "@/components/conflicts/ConflictSummary";
import { ConflictTimeline } from "@/components/conflicts/ConflictTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Fact, TagList } from "@/components/shared/Facts";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate, formatLongDate, formatTime } from "@/lib/utils";
import type { CampusEvent } from "@/lib/types/event";

const DECISION_TONE: Record<string, string> = {
  approved: "bg-emerald-500",
  changes_requested: "bg-amber-500",
  rejected: "bg-rose-500",
  submitted: "bg-blue-400",
};

export function EventDetailsView({ event }: { event: CampusEvent }) {
  const { canSeeConflicts } = useAuth();
  const conflict = event.conflictId ? MOCK_CONFLICTS[event.conflictId] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/calendar", label: "Back to calendar" }}
        meta={
          <>
            <Badge>{event.eventType}</Badge>
            <StatusBadge status={event.status} />
            {canSeeConflicts && event.conflictSeverity !== "none" && <SeverityBadge severity={event.conflictSeverity} />}
          </>
        }
        title={event.title}
        description={`Hosted by ${event.organizer}`}
        actions={
          <>
            {canSeeConflicts && conflict && (
              <Button asChild variant="outline">
                <Link href={`/events/${event.id}/conflicts`}>
                  <ShieldAlert /> Conflict details
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href={`/events/${event.id}/edit`}>
                <Edit /> Edit event
              </Link>
            </Button>
          </>
        }
      />

      <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
        <Fact icon={<CalendarDays />} label="Date">
          {formatLongDate(event.date)}
        </Fact>
        <Fact icon={<Clock />} label="Time">
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </Fact>
        <Fact icon={<MapPin />} label="Venue">
          {event.venue}
        </Fact>
        <Fact icon={<Users />} label="Expected guests">
          {event.expectedAttendance} people
        </Fact>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-ink">About this event</h2>
            <p className="max-w-prose text-[15px] leading-relaxed text-body">{event.description}</p>
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted">Open to</p>
              <TagList tags={event.audience} />
            </div>
          </Card>

          <Card className="space-y-5 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">Review history</h2>
              <span className="text-sm text-muted">{event.reviews?.length ?? 0} updates</span>
            </div>
            {event.reviews && event.reviews.length > 0 ? (
              <ol className="relative space-y-6 border-l border-white/12 pl-6">
                {event.reviews.map((r) => (
                  <li key={r.id} className="relative">
                    <span
                      className={`absolute -left-[1.9rem] top-1.5 size-3 rounded-full ring-4 ring-[#0b1330] ${DECISION_TONE[r.decision] ?? "bg-blue-400"}`}
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-ink">
                        {r.reviewerName} <span className="font-normal text-muted">· {r.reviewerRole}</span>
                      </p>
                      <time className="text-xs text-muted">{formatDate(r.timestamp)}</time>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-body">{r.comment}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">Submitted. Waiting for the first review.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {canSeeConflicts && (
            <Card className="space-y-5 p-5 sm:p-7">
              <h2 className="text-lg font-semibold text-ink">Conflict check</h2>
              <ConflictSummary
                eventId={event.id}
                severity={event.conflictSeverity}
                conflictId={event.conflictId}
                summaryText={conflict?.summary || "Nothing else is using this venue or time."}
                showActions={false}
              />
              {conflict && (
                <>
                  <ConflictTimeline
                    yourEvent={conflict.yourEvent}
                    competingEvent={conflict.competingEvent}
                    overlapMinutes={conflict.overlapMinutes}
                    overlapWindow={conflict.overlapWindow}
                  />
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/events/${event.id}/conflicts`}>See full conflict details</Link>
                  </Button>
                </>
              )}
            </Card>
          )}

          <Card className="space-y-4 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-ink">Organizer</h2>
            <div className="space-y-4">
              <Fact icon={<User />} label="Submitted by">
                {event.submitterName}
              </Fact>
              <Fact icon={<Mail />} label="Email">
                <span className="break-all">{event.submitterEmail}</span>
              </Fact>
              <Fact icon={<Building2 />} label="Submitted on">
                {formatDate(event.submittedAt)}
              </Fact>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
