import { Bell, Layers, Lock, MailCheck, ShieldCheck, Zap } from "lucide-react";
import { SectionHead } from "./SectionHead";

const FEATURES = [
  { icon: ShieldCheck, title: "Live conflict check", text: "Venue, organizer, time and audience are checked as you type." },
  { icon: Zap, title: "Free slots, suggested", text: "When something clashes, we offer open times and rooms that fit." },
  { icon: MailCheck, title: "Human review", text: "ACM Core reviews every event and can approve, return or decline it." },
  { icon: Layers, title: "One shared calendar", text: "Approved events show up for everyone in a single, filterable view." },
  { icon: Bell, title: "Clear status", text: "Draft, in review, approved or changes requested. Always visible." },
  { icon: Lock, title: "Your clubs, your data", text: "Organizers edit their own events. Reviewers see what they need." },
];

export function Features() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHead
        eyebrow="Why Resolve"
        title="Built for the people who run campus events"
        text="Resolve replaces scattered chats and spreadsheets with one place to plan, check and publish."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="glass space-y-4 rounded-[var(--radius-panel)] p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-blue-400/40"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-500/10 text-blue-200 ring-1 ring-blue-400/25">
              <Icon className="size-5" />
            </span>
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <p className="text-[15px] leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
