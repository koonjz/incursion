import React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { SectionHead } from "./SectionHead";

const FAQS = [
  {
    q: "Who is authorized to submit campus events on ACM Resolve?",
    a: "Any registered student chapter lead, faculty coordinator, or recognized club organizer with a campus account. Simply log in using your student/staff email to access the submission portal and conflict radar.",
  },
  {
    q: "How does the deterministic conflict detection engine work?",
    a: "When you select a room, date, and time, Resolve cross-references room occupancy, technical facility requirements, and the expected attendance cohort. If an overlap or double-booking exists, Resolve flags the severity (Critical, High, Moderate) and suggests verified open slots.",
  },
  {
    q: "Can I still submit an event if a clash is flagged?",
    a: "Yes. Organizers can submit with conflict notes (e.g., joint partnerships or split sessions). However, ACM Core and faculty verifiers will be alerted to the collision and may suggest an alternative slot before approving.",
  },
  {
    q: "What is the expected turnaround for ACM Core verification?",
    a: "ACM Core reviews submissions in sequence. Automated notifications update your dashboard status in real-time between Draft, Under Review, Changes Requested, and Approved.",
  },
  {
    q: "Can I amend event details or venue requests post-submission?",
    a: "Yes. You can edit dates, rooms, or attendee limits directly from your 'My Submissions' dashboard. Any modification re-runs the clash radar immediately to ensure continued calendar integrity.",
  },
  {
    q: "Which events appear on the public campus calendar?",
    a: "Only officially verified and approved events appear on the public student directory. Pending reviews and draft proposals remain strictly confined to organizer and review team portals.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHead
        className="mx-auto text-center"
        eyebrow="Frequently Asked Questions"
        title="Institutional governance & booking rules"
        text="Everything you need to know about room allocations, clash verification, and the approval lifecycle."
      />

      <div className="space-y-3.5 mt-8">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="glass group rounded-2xl border border-white/8 transition-colors open:border-blue-500/40 open:bg-[#0c101c]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-sm sm:text-base font-bold text-white marker:hidden focus-visible:outline-2 focus-visible:outline-blue-400 [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <ChevronDown className="size-4 shrink-0 text-blue-400 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-300 border-t border-white/6 pt-3 mt-1 font-normal">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
