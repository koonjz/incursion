"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { ConflictPanel } from "@/components/conflicts/ConflictPanel";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EventFormFields, useEventForm } from "./EventFormFields";
import type { CampusEvent } from "@/lib/types/event";

export function EventEditView({ event }: { event: CampusEvent }) {
  const router = useRouter();
  const form = useEventForm({
    title: event.title,
    eventType: event.eventType,
    organizer: event.organizer,
    club: event.club,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    expectedAttendance: event.expectedAttendance,
    audience: event.audience,
    description: event.description,
  });
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const save = () => {
    if (!form.valid) return;
    setState("saving");
    setTimeout(() => {
      setState("saved");
      setTimeout(() => router.push(`/events/${event.id}`), 800);
    }, 600);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        back={{ href: `/events/${event.id}`, label: "Back to event" }}
        title="Edit event"
        description="Change the schedule, venue or details. The conflict check updates as you edit."
        actions={
          <Button onClick={save} disabled={state !== "idle" || !form.valid}>
            {state === "saved" ? <CheckCircle2 /> : state === "saving" ? <Loader2 className="animate-spin" /> : <Save />}
            {state === "saved" ? "Saved" : state === "saving" ? "Saving" : "Save changes"}
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <EventFormFields form={form} />
        <ConflictPanel conflict={form.conflict} onSelectSlot={form.applySlot} selectedSlotId={form.selectedSlotId} />
      </div>
    </div>
  );
}
