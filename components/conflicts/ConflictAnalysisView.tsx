"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, CheckCircle2, Edit, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, SectionHeading } from "@/components/shared/PageHeader";
import { SeverityBadge } from "./SeverityBadge";
import { ConflictComparison } from "./ConflictComparison";
import { ConflictTimeline } from "./ConflictTimeline";
import { ConflictReason } from "./ConflictReason";
import { SuggestedSlot } from "./SuggestedSlot";
import type { CampusEvent } from "@/lib/types/event";
import type { EventConflict, SuggestedSlot as SuggestedSlotType } from "@/lib/types/conflict";

export function ConflictAnalysisView({ event, conflict }: { event: CampusEvent; conflict: EventConflict }) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<SuggestedSlotType | null>(null);
  const [sent, setSent] = useState(false);

  const requestReschedule = () => {
    setSent(true);
    setTimeout(() => router.push(`/events/${event.id}`), 1200);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ href: `/events/${event.id}`, label: event.title }}
        meta={<SeverityBadge severity={conflict.severity} />}
        title="Conflict details"
        description={conflict.summary}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/events/${event.id}/edit`}>
                <Edit /> Edit event
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/calendar">
                <Calendar /> Calendar
              </Link>
            </Button>
          </>
        }
      />

      <section className="space-y-4">
        <SectionHeading title="Side by side" />
        <ConflictComparison yourEvent={conflict.yourEvent} competingEvent={conflict.competingEvent} />
      </section>

      <Card className="p-5 sm:p-6">
        <ConflictTimeline
          yourEvent={conflict.yourEvent}
          competingEvent={conflict.competingEvent}
          overlapMinutes={conflict.overlapMinutes}
          overlapWindow={conflict.overlapWindow}
        />
      </Card>

      <section className="space-y-4">
        <SectionHeading
          title="Why this was flagged"
          action={<span className="text-sm text-muted">{conflict.reasons.length} factors</span>}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {conflict.reasons.map((r, i) => (
            <ConflictReason key={r.id} reason={r} index={i} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Free time slots" />
        <p className="-mt-2 text-sm text-muted">Moving to one of these removes the clash.</p>
        <div className="grid gap-3">
          {conflict.suggestedSlots.map((slot) => (
            <SuggestedSlot key={slot.id} slot={slot} selected={selectedSlot?.id === slot.id} onSelect={setSelectedSlot} />
          ))}
        </div>

        {selectedSlot && (
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-ink">
                {selectedSlot.startTimeFormatted} – {selectedSlot.endTimeFormatted} · {selectedSlot.venue}
              </p>
              <p className="text-sm text-muted">ACM Core will be asked to move your event to this slot.</p>
            </div>
            <Button onClick={requestReschedule} disabled={sent}>
              {sent ? (
                <>
                  <CheckCircle2 /> Request sent
                </>
              ) : (
                <>
                  <Send /> Request this slot
                </>
              )}
            </Button>
          </Card>
        )}
      </section>

      <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-300" />
        <p>
          <span className="font-medium text-ink">ACM Core makes the final call.</span> Conflict alerts are advice to
          prevent double-booking. The assigned reviewer can still approve overlapping events or change the venue.
        </p>
      </div>
    </div>
  );
}
