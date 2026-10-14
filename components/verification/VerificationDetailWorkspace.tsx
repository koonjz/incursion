"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, CalendarDays, Clock, Loader2, MapPin, ShieldCheck, Users, XCircle } from "lucide-react";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
import { ConflictComparison } from "@/components/conflicts/ConflictComparison";
import { ConflictTimeline } from "@/components/conflicts/ConflictTimeline";
import { ConflictReason } from "@/components/conflicts/ConflictReason";
import { SuggestedSlot } from "@/components/conflicts/SuggestedSlot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Fact, TagList } from "@/components/shared/Facts";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate, formatLongDate, formatTime } from "@/lib/utils";
import type { CampusEvent } from "@/lib/types/event";
import type { EventConflict } from "@/lib/types/conflict";

type Decision = "approved" | "changes_requested" | "rejected";

const RESULT: Record<Decision, { title: string; text: string }> = {
  approved: { title: "Event approved", text: "It is now on the campus calendar." },
  changes_requested: { title: "Changes requested", text: "The organizers have been notified." },
  rejected: { title: "Event rejected", text: "Your notes were saved with the decision." },
};

export function VerificationDetailWorkspace({ event, conflict }: { event: CampusEvent; conflict?: EventConflict | null }) {
  const router = useRouter();
  const { isAcmCore, user } = useAuth();
  const [notes, setNotes] = useState("");
  const [changes, setChanges] = useState("");
  const [askingChanges, setAskingChanges] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Decision | null>(null);

  React.useEffect(() => {
    if (!isAcmCore) {
      router.replace("/dashboard");
    }
  }, [isAcmCore, router]);

  if (!isAcmCore) {
    return null;
  }

  const decide = async (d: Decision) => {
    setBusy(true);

    try {
      const decisionMap: Record<Decision, "APPROVED" | "CHANGES_REQUESTED" | "REJECTED"> = {
        approved: "APPROVED",
        changes_requested: "CHANGES_REQUESTED",
        rejected: "REJECTED",
      };

      const payload = {
        decision: decisionMap[d],
        comment: notes.trim() || (d === "approved" ? "Approved by ACM Core reviewer" : undefined),
        changesRequested: d === "changes_requested" && changes.trim() ? [changes.trim()] : [],
        overrideConflict: true,
      };

      const res = await fetch(`/api/events/${event.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Failed to submit review decision: ${res.statusText}`);
      }

      setDone(d);

      // Notify queue, dashboard, and other tabs that an event was reviewed/approved
      try {
        localStorage.setItem("acm_event_created", Date.now().toString());
      } catch {}

      router.refresh();
    } catch (err: any) {
      console.error("[review error]", err);
      alert(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const locked = busy || !!done;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/verification", label: "Back to review queue" }}
        meta={
          <>
            <Badge>{event.eventType}</Badge>
            <StatusBadge status={event.status} />
            {event.conflictSeverity !== "none" && <SeverityBadge severity={event.conflictSeverity} />}
          </>
        }
        title={event.title}
        description={`Hosted by ${event.organizer} · submitted by ${event.submitterName}`}
      />

      {done && (
        <div role="status" className="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-emerald-400/25 bg-emerald-400/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-300" />
            <div>
              <p className="font-semibold text-emerald-200">{RESULT[done].title}</p>
              <p className="text-sm text-emerald-300/90">{RESULT[done].text}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/verification";
            }}
          >
            Back to queue
          </Button>
        </div>
      )}

      <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
        <Fact icon={<CalendarDays />} label="Date">{formatLongDate(event.date)}</Fact>
        <Fact icon={<Clock />} label="Time">{formatTime(event.startTime)} – {formatTime(event.endTime)}</Fact>
        <Fact icon={<MapPin />} label="Venue">{event.venue}</Fact>
        <Fact icon={<Users />} label="Expected guests">{event.expectedAttendance} people</Fact>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-ink">About this event</h2>
            <p className="max-w-prose text-[15px] leading-relaxed text-body">{event.description}</p>
            <div className="space-y-2">
              <p className="text-xs text-muted">Open to</p>
              <TagList tags={event.audience} />
            </div>
          </Card>

          {conflict && (
            <Card className="space-y-6 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Conflict details</h2>
                <SeverityBadge severity={conflict.severity} />
              </div>
              <ConflictComparison yourEvent={conflict.yourEvent} competingEvent={conflict.competingEvent} />
              <ConflictTimeline
                yourEvent={conflict.yourEvent}
                competingEvent={conflict.competingEvent}
                overlapMinutes={conflict.overlapMinutes}
                overlapWindow={conflict.overlapWindow}
              />
              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-ink">Why this was flagged</h3>
                {conflict.reasons.map((r, i) => (
                  <ConflictReason key={r.id} reason={r} index={i} />
                ))}
              </div>
              {conflict.suggestedSlots.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-ink">Free time slots</h3>
                  {conflict.suggestedSlots.map((s) => (
                    <SuggestedSlot key={s.id} slot={s} />
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card className="space-y-4 p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-ink">Review history</h2>
            {event.reviews && event.reviews.length > 0 ? (
              <ul className="space-y-4">
                {event.reviews.map((r) => (
                  <li key={r.id} className="glass-inset rounded-2xl p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-ink">{r.reviewerName}</p>
                      <time className="text-xs text-muted">{formatDate(r.timestamp)}</time>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-body">{r.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No reviews yet.</p>
            )}
          </Card>
        </div>

        <Card className="space-y-5 p-5 sm:p-7 lg:sticky lg:top-0">
          <div>
            <h2 className="text-lg font-semibold text-ink">Your decision</h2>
            <p className="text-sm text-muted">Conflicts are advice only. You decide.</p>
          </div>

          <div>
            <Label htmlFor="notes">Notes for the organizers</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={locked}
              placeholder="Approval conditions, equipment, or reasons for your decision"
            />
          </div>

          {askingChanges && (
            <div>
              <Label htmlFor="changes">What should change?</Label>
              <Textarea
                id="changes"
                value={changes}
                onChange={(e) => setChanges(e.target.value)}
                disabled={locked}
                placeholder="e.g. Cap attendance at 120, or move to Turing Hall at 3:00 PM"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2.5">
            <Button className="w-full" size="lg" onClick={() => decide("approved")} disabled={locked}>
              {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Approve event
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={() => (askingChanges ? decide("changes_requested") : setAskingChanges(true))}
                disabled={locked || (askingChanges && !changes.trim())}
              >
                <AlertTriangle /> {askingChanges ? "Send request" : "Request changes"}
              </Button>
              <Button variant="outline" onClick={() => decide("rejected")} disabled={locked} className="text-rose-300 hover:text-rose-200">
                <XCircle /> Reject
              </Button>
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="size-4 shrink-0" /> Recorded under {user?.name || "Reviewer"}, {user?.roleLabel || "Reviewer"}.
          </p>
        </Card>
      </div>
    </div>
  );
}
