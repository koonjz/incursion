import { MOCK_CLUBS } from "@/lib/mock/events";
import { SectionHead } from "./SectionHead";

const STEPS = [
  { title: "Submit", text: "Add the event details and pick a venue." },
  { title: "Check", text: "Conflicts show up instantly, with free slots suggested." },
  { title: "Review", text: "ACM Core reviews your event and replies with a decision." },
  { title: "Publish", text: "Approved events go on the campus calendar." },
];

export function Process() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="how">
      <SectionHead eyebrow="How it works" title="From idea to calendar in four steps" />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="glass relative space-y-3 rounded-[var(--radius-panel)] p-6">
            <span className="font-display text-5xl font-medium leading-none text-blue-300/40">0{i + 1}</span>
            <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14">
        <p className="mb-4 text-sm font-medium text-muted">Clubs already planning on Resolve</p>
        <ul className="flex flex-wrap gap-2.5">
          {MOCK_CLUBS.map((c) => (
            <li
              key={c.id}
              className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-body transition-colors hover:border-blue-400/40 hover:bg-white/10"
            >
              {c.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
