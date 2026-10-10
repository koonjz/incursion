import { Code2, Handshake, Mic, Music, Presentation, Trophy, Wrench } from "lucide-react";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { SectionHead } from "./SectionHead";
import type { EventType } from "@/lib/types/event";

const TYPES: { type: EventType; label: string; text: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "Workshop", label: "Workshops", text: "Hands-on sessions to build real skills.", icon: Wrench },
  { type: "Symposium", label: "Symposiums", text: "Talks and panels across departments.", icon: Presentation },
  { type: "Hackathon", label: "Hackathons", text: "Build something in a weekend.", icon: Code2 },
  { type: "Guest Lecture", label: "Guest lectures", text: "Hear from people working in the field.", icon: Mic },
  { type: "Competition", label: "Competitions", text: "Contests, coding rounds and showdowns.", icon: Trophy },
  { type: "Cultural", label: "Cultural", text: "Evenings of music, art and design.", icon: Music },
  { type: "Networking", label: "Networking", text: "Meet alumni, mentors and peers.", icon: Handshake },
];

export function Categories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHead
        eyebrow="What's on"
        title="Find the kind of event you like"
        text="From late-night hackathons to guest lectures, every format has a home on the calendar."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map(({ type, label, text, icon: Icon }) => {
          const count = MOCK_EVENTS.filter((e) => e.eventType === type).length;
          return (
            <div
              key={type}
              className="glass group space-y-4 rounded-[var(--radius-panel)] p-5 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-blue-400/40"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-ink">{label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
              </div>
              <p className="text-xs font-medium text-blue-300">
                {count} {count === 1 ? "event" : "events"} this term
              </p>
            </div>
          );
        })}
        <div className="glass-inset flex flex-col justify-center gap-2 rounded-[var(--radius-panel)] p-5 sm:col-span-2 lg:col-span-1">
          <p className="font-display text-2xl font-medium text-ink">Something else?</p>
          <p className="text-sm leading-relaxed text-muted">
            Any format works. Pick the closest type when you submit and describe the rest.
          </p>
        </div>
      </div>
    </section>
  );
}
