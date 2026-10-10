"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { MOCK_CLUBS, MOCK_VENUES } from "@/lib/mock/events";
import { evaluateLiveConflict } from "@/lib/mock/conflicts";
import { AUDIENCE_OPTIONS, EVENT_TYPE_OPTIONS, resolveVenueName } from "@/lib/events";
import { cn } from "@/lib/utils";
import type { EventType } from "@/lib/types/event";
import type { SuggestedSlot } from "@/lib/types/conflict";

export interface EventFormValues {
  title: string;
  eventType: EventType;
  organizer: string;
  club: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  expectedAttendance: number;
  audience: string[];
  description: string;
}

/** Shared state + live conflict evaluation for the submit and edit screens. */
export function useEventForm(initial: EventFormValues) {
  const [values, setValues] = useState<EventFormValues>({
    ...initial,
    venue: resolveVenueName(initial.venue, MOCK_VENUES),
  });
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>();

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const toggleAudience = (tag: string) =>
    setValues((v) => ({
      ...v,
      audience: v.audience.includes(tag) ? v.audience.filter((t) => t !== tag) : [...v.audience, tag],
    }));

  const applySlot = (slot: SuggestedSlot) => {
    setSelectedSlotId(slot.id);
    setValues((v) => ({ ...v, startTime: slot.startTime, endTime: slot.endTime, venue: slot.venue || v.venue }));
  };

  const conflict = evaluateLiveConflict({
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    venue: values.venue,
    expectedAttendance: values.expectedAttendance,
    audience: values.audience,
    eventType: values.eventType,
  });

  const timeError =
    values.startTime && values.endTime && values.endTime <= values.startTime
      ? "End time must be after the start time."
      : null;
  const valid = !!values.title.trim() && !!values.date && !!values.startTime && !!values.endTime && !timeError && values.audience.length > 0;

  return { values, set, toggleAudience, applySlot, selectedSlotId, conflict, timeError, valid };
}

type Form = ReturnType<typeof useEventForm>;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-5 p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

export function EventFormFields({ form }: { form: Form }) {
  const { values: v, set, toggleAudience, timeError } = form;
  const venueKnown = MOCK_VENUES.some((o) => o.name === v.venue);

  return (
    <div className="space-y-5">
      <Section title="Event details">
        <div>
          <Label htmlFor="title">Event name</Label>
          <Input id="title" required value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Intro to Distributed Systems" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="eventType">Type</Label>
            <NativeSelect id="eventType" value={v.eventType} onChange={(e) => set("eventType", e.target.value as EventType)}>
              {EVENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="club">Hosting club</Label>
            <NativeSelect
              id="club"
              value={v.club}
              onChange={(e) => {
                set("club", e.target.value);
                set("organizer", e.target.value);
              }}
            >
              {MOCK_CLUBS.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {!MOCK_CLUBS.some((c) => c.name === v.club) && <option value={v.club}>{v.club}</option>}
            </NativeSelect>
          </div>
        </div>
        <div>
          <Label htmlFor="organizer">Organizers</Label>
          <Input id="organizer" value={v.organizer} onChange={(e) => set("organizer", e.target.value)} placeholder="e.g. ACM × Web Development Club" />
          <p className="mt-1.5 text-xs text-muted">Add any partner clubs or departments.</p>
        </div>
      </Section>

      <Section title="Date and time">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" required value={v.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="start">Starts</Label>
            <Input id="start" type="time" required value={v.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end">Ends</Label>
            <Input id="end" type="time" required value={v.endTime} onChange={(e) => set("endTime", e.target.value)} aria-invalid={!!timeError} />
          </div>
        </div>
        {timeError && (
          <p role="alert" className="flex items-center gap-2 text-sm text-rose-300">
            <AlertCircle className="size-4" /> {timeError}
          </p>
        )}
      </Section>

      <Section title="Venue and audience">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div>
            <Label htmlFor="venue">Venue</Label>
            <NativeSelect id="venue" value={v.venue} onChange={(e) => set("venue", e.target.value)}>
              {MOCK_VENUES.map((o) => (
                <option key={o.id} value={o.name}>
                  {o.name} · seats {o.capacity}
                </option>
              ))}
              {!venueKnown && <option value={v.venue}>{v.venue}</option>}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="attendance">Expected guests</Label>
            <Input
              id="attendance"
              type="number"
              min={1}
              value={v.expectedAttendance}
              onChange={(e) => set("expectedAttendance", parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Who is it for?</legend>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map((tag) => {
              const on = v.audience.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAudience(tag)}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,color] duration-200",
                    on
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-white/14 bg-white/[0.06] text-body hover:border-blue-400/50 hover:bg-white/10"
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">We use this to spot events competing for the same students.</p>
        </fieldset>
      </Section>

      <Section title="Description">
        <div>
          <Label htmlFor="description">What is the event about?</Label>
          <Textarea
            id="description"
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Goals, what to bring, equipment needed, special requirements"
          />
        </div>
      </Section>
    </div>
  );
}
