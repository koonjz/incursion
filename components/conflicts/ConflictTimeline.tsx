import { AlertTriangle } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { EventSlotComparison } from "@/lib/types/conflict";

interface ConflictTimelineProps {
  yourEvent: EventSlotComparison;
  competingEvent: EventSlotComparison;
  overlapMinutes?: number;
  overlapWindow?: string;
}

function toMinutes(t: string) {
  if (!t) return 0;
  const lower = t.toLowerCase();
  const parts = t.split(":");
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1]?.slice(0, 2) ?? "0", 10) || 0;
  if (lower.includes("pm") && h < 12) h += 12;
  if (lower.includes("am") && h === 12) h = 0;
  return h * 60 + m;
}

export function ConflictTimeline({
  yourEvent,
  competingEvent,
  overlapMinutes = 0,
  overlapWindow,
}: ConflictTimelineProps) {
  const yStart = toMinutes(yourEvent.startTime);
  const yEnd = toMinutes(yourEvent.endTime);
  const cStart = toMinutes(competingEvent.startTime);
  const cEnd = toMinutes(competingEvent.endTime);

  // Pad the visible range by 15 minutes so bars never touch the edges.
  const min = Math.min(yStart, cStart) - 15;
  const max = Math.max(yEnd, cEnd) + 15;
  const span = Math.max(max - min, 1);
  const pos = (v: number) => ((v - min) / span) * 100;

  const oStart = Math.max(yStart, cStart);
  const oEnd = Math.min(yEnd, cEnd);
  const hasOverlap = oEnd > oStart;

  const h = Math.floor(overlapMinutes / 60);
  const m = overlapMinutes % 60;
  const overlapLabel = overlapMinutes > 0 ? `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m` : ""}`.trim() : "";

  const tracks = [
    { label: "Your event", ev: yourEvent, s: yStart, e: yEnd, bar: "bg-blue-600 text-white" },
    { label: "Existing event", ev: competingEvent, s: cStart, e: cEnd, bar: "bg-blue-400/25 text-white" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink">Timeline</h4>
        {hasOverlap && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-300 ring-1 ring-rose-400/30">
            <AlertTriangle className="size-3.5" />
            {overlapLabel || "Overlap"} overlap{overlapWindow ? ` · ${overlapWindow}` : ""}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {tracks.map((t) => (
          <div key={t.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="font-medium text-ink">{t.label}</span>
              <span className="text-muted">
                {formatTime(t.ev.startTime)} – {formatTime(t.ev.endTime)}
              </span>
            </div>
            <div className="relative h-9 overflow-hidden rounded-xl bg-white/5">
              {hasOverlap && (
                <div
                  className="absolute inset-y-0 bg-rose-400/25"
                  style={{ left: `${pos(oStart)}%`, width: `${pos(oEnd) - pos(oStart)}%` }}
                />
              )}
              <div
                className={`absolute inset-y-1 flex items-center overflow-hidden rounded-lg px-3 text-xs font-medium ${t.bar}`}
                style={{ left: `${pos(t.s)}%`, width: `${pos(t.e) - pos(t.s)}%` }}
              >
                <span className="truncate">{t.ev.title}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted">
        <span>{formatTime(`${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`)}</span>
        <span>{formatTime(`${Math.floor(max / 60)}:${String(max % 60).padStart(2, "0")}`)}</span>
      </div>
    </div>
  );
}
