import { Building2, Users } from "lucide-react";
import { MOCK_VENUES } from "@/lib/mock/events";
import { SectionHead } from "./SectionHead";

export function Venues() {
  const max = Math.max(...MOCK_VENUES.map((v) => v.capacity));
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <SectionHead
        eyebrow="Spaces"
        title="Six venues, one booking view"
        text="Know the size and facilities of each space before you pick one."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_VENUES.map((v) => (
          <div key={v.id} className="glass space-y-4 rounded-[var(--radius-panel)] p-6">
            <div className="space-y-1">
              <h3 className="font-semibold leading-snug text-ink">{v.name}</h3>
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Building2 className="size-3.5" />
                {v.building}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-body">
                  <Users className="size-3.5 text-blue-300" /> Seats
                </span>
                <span className="font-semibold text-ink">{v.capacity}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-300"
                  style={{ width: `${(v.capacity / max) * 100}%` }}
                />
              </div>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {v.facilities.map((f) => (
                <li key={f} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-body">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
