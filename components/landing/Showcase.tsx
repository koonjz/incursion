import { CheckCircle2 } from "lucide-react";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { ConflictTimeline } from "@/components/conflicts/ConflictTimeline";
import { SuggestedSlot } from "@/components/conflicts/SuggestedSlot";
import { SeverityBadge } from "@/components/conflicts/SeverityBadge";
import { SectionHead } from "./SectionHead";

const POINTS = [
  "Venue already booked? You will know before you submit.",
  "Two events chasing the same students? We flag the overlap.",
  "Every clash comes with free slots you can switch to in one tap.",
];

export function Showcase() {
  const demo = MOCK_CONFLICTS["cnf-201"];
  const slot = demo.suggestedSlots[0];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHead
            className="mb-8"
            eyebrow="Conflict check"
            title="See clashes before they happen"
            text="Planning an event usually means chasing people for room bookings. Resolve checks the calendar for you, live, while you fill in the form."
          />
          <ul className="space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed text-body">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-strong space-y-6 rounded-[var(--radius-hero)] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Live preview</p>
              <h3 className="mt-1 font-display text-2xl font-medium leading-snug text-ink">{demo.yourEvent.title}</h3>
            </div>
            <SeverityBadge severity={demo.severity} />
          </div>
          <ConflictTimeline
            yourEvent={demo.yourEvent}
            competingEvent={demo.competingEvent}
            overlapMinutes={demo.overlapMinutes}
            overlapWindow={demo.overlapWindow}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Suggested fix</p>
            {slot && <SuggestedSlot slot={slot} />}
          </div>
        </div>
      </div>
    </section>
  );
}
