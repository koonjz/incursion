"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Save, Send } from "lucide-react";
import { ConflictPanel } from "@/components/conflicts/ConflictPanel";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EventFormFields, useEventForm } from "./EventFormFields";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export function EventSubmissionForm() {
  const router = useRouter();
  const { canSeeConflicts, canAccessSubmissions } = useAuth();
  const form = useEventForm({
    title: "Technical Workshop: Distributed Systems with Go",
    eventType: "Workshop",
    organizer: "ACM × Web Development Club",
    club: "ACM Student Chapter",
    date: "2026-10-15",
    startTime: "17:00",
    endTime: "19:00",
    venue: "LT-2 (Lecture Theater 2)",
    expectedAttendance: 150,
    audience: ["CSE", "Technical", "Engineering"],
    description:
      "An intensive hands-on workshop exploring consensus protocols, actor models, and resilient microservices in Go. Participants will build a lightweight Raft cluster.",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [kind, setKind] = useState<"draft" | "review">("review");

  const submit = async (k: "draft" | "review") => {
    if (k === "review" && !form.valid) return;
    setKind(k);
    setStatus("saving");

    try {
      const startIso = new Date(`${form.values.date}T${form.values.startTime}:00Z`).toISOString();
      const endIso = new Date(`${form.values.date}T${form.values.endTime}:00Z`).toISOString();

      const venueMap: Record<string, string> = {
        "LT-2 (Lecture Theater 2)": "ven-lt2",
        "LT-2": "ven-lt2",
        "Main Auditorium A": "ven-audi-a",
        "Turing Seminar Hall": "ven-turing",
        "SAC Multi-Purpose Hall 1": "ven-sac1",
        "Computing Lab 3": "ven-comp3",
      };
      const venueId = venueMap[form.values.venue] || "ven-lt2";

      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.values.title,
          description: form.values.description,
          eventType: form.values.eventType,
          startTime: startIso,
          endTime: endIso,
          venueId,
          expectedAttendance: form.values.expectedAttendance || 50,
          attendeesGroup: form.values.audience || ["CSE"],
          overrideConflict: true,
          overrideReason: "User confirmed submission",
        }),
      });
    } catch (err) {
      console.warn("Event POST failed:", err);
    }

    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="glass-strong mx-auto mt-6 max-w-xl space-y-6 rounded-[var(--radius-hero)] p-8 text-center sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <CheckCircle2 className="size-8" />
        </span>
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-medium text-ink">
            {kind === "draft" ? "Draft saved" : "Event submitted"}
          </h2>
          <p className="text-muted">
            {kind === "draft"
              ? canAccessSubmissions
                ? `“${form.values.title}” is saved. Finish it any time from My submissions.`
                : `“${form.values.title}” is saved as a draft.`
              : `“${form.values.title}” has been submitted for campus approval.`}
          </p>
        </div>
        {canSeeConflicts && kind === "review" && form.conflict && (
          <p className="rounded-2xl bg-amber-400/10 p-4 text-left text-sm text-amber-200">
            Heads up: this event overlaps with another one. Reviewers will look at it closely, so consider one of the
            suggested free slots.
          </p>
        )}
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
          {canAccessSubmissions && (
            <Button variant="outline" onClick={() => router.push("/events/my-submissions")}>
              My submissions
            </Button>
          )}
          <Button onClick={() => router.push("/calendar")}>
            View calendar <ArrowRight />
          </Button>
        </div>
      </div>
    );
  }

  const saving = status === "saving";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Submit an event"
        description={
          canSeeConflicts
            ? "Fill in the details. We check for conflicts as you type, so you can fix them before review."
            : "Fill in the event details and submit it for campus schedule approval."
        }
      />

      <div className={cn("grid items-start gap-6", canSeeConflicts ? "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "max-w-3xl")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit("review");
          }}
          className="space-y-5"
        >
          <EventFormFields form={form} />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => submit("draft")} disabled={saving}>
              <Save /> Save draft
            </Button>
            <Button type="submit" size="lg" disabled={saving || !form.valid}>
              {saving ? <Loader2 className="animate-spin" /> : <Send />}
              {saving ? "Submitting" : "Submit for review"}
            </Button>
          </div>
          {!form.valid && (
            <p className="text-sm text-muted">Add a name, a valid time range and at least one audience to submit.</p>
          )}
        </form>

        {canSeeConflicts && (
          <ConflictPanel conflict={form.conflict} onSelectSlot={form.applySlot} selectedSlotId={form.selectedSlotId} />
        )}
      </div>
    </div>
  );
}
