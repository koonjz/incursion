import { ChevronDown } from "lucide-react";
import { SectionHead } from "./SectionHead";

const FAQS = [
  {
    q: "Who can submit an event?",
    a: "Any club lead or organizer with a campus account. Sign in, fill in the form and submit it for review.",
  },
  {
    q: "What happens if my event clashes with another?",
    a: "You see the clash straight away, with the overlapping event and a few free slots. You can still submit, but reviewers will look at it closely.",
  },
  {
    q: "How long does a review take?",
    a: "ACM Core reviews events in the order they arrive. Status updates appear on My submissions as soon as there is a decision.",
  },
  {
    q: "Can I edit an event after submitting?",
    a: "Yes. You can edit any of your events, and the conflict check runs again with your changes.",
  },
  {
    q: "Which events appear on the public calendar?",
    a: "Only approved events. Drafts and events in review are visible to organizers and reviewers.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHead className="mx-auto text-center" eyebrow="Questions" title="Good to know" />
      <div className="space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="glass group rounded-2xl open:border-blue-400/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-[15px] font-semibold text-ink marker:hidden focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
              {f.q}
              <ChevronDown className="size-5 shrink-0 text-blue-300 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
