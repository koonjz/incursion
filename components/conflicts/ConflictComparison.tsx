import { Clock, Layers, MapPin, Users } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { EventSlotComparison } from "@/lib/types/conflict";

function Side({ heading, tone, ev, approx }: { heading: string; tone: string; ev: EventSlotComparison; approx?: boolean }) {
  const rows = [
    { icon: Clock, label: "Time", value: `${formatTime(ev.startTime)} – ${formatTime(ev.endTime)}` },
    { icon: MapPin, label: "Venue", value: ev.venue },
    { icon: Users, label: "Expected", value: `${approx ? "~" : ""}${ev.expectedAttendance} people` },
    { icon: Layers, label: "Audience", value: ev.audience?.join(", ") || "General" },
  ];
  return (
    <div className="glass-inset space-y-4 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{heading}</span>
        <span className="text-xs text-muted">{ev.eventType}</span>
      </div>
      <div>
        <h4 className="font-display text-xl font-medium leading-snug text-ink">{ev.title}</h4>
        <p className="mt-0.5 text-sm text-muted">{ev.organizer}</p>
      </div>
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2.5 text-sm">
            <r.icon className="mt-0.5 size-4 shrink-0 text-blue-300" />
            <dt className="sr-only">{r.label}</dt>
            <dd className="text-body">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ConflictComparison({
  yourEvent,
  competingEvent,
}: {
  yourEvent: EventSlotComparison;
  competingEvent: EventSlotComparison;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Side heading="Your event" tone="bg-blue-600 text-white" ev={yourEvent} />
      <Side heading="Existing event" tone="bg-blue-400/15 text-blue-100" ev={competingEvent} approx />
    </div>
  );
}
