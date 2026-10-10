import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "./SeverityBadge";
import { ConflictTimeline } from "./ConflictTimeline";
import { ConflictReason } from "./ConflictReason";
import { SuggestedSlot } from "./SuggestedSlot";
import type { EventConflict, SuggestedSlot as SuggestedSlotType } from "@/lib/types/conflict";

interface ConflictCardProps {
  conflict: EventConflict;
  showTimeline?: boolean;
  showSuggestions?: boolean;
  onApplySlot?: (slot: SuggestedSlotType) => void;
  detailedLink?: boolean;
}

export function ConflictCard({
  conflict,
  showTimeline = true,
  showSuggestions = true,
  onApplySlot,
  detailedLink = true,
}: ConflictCardProps) {
  return (
    <div className="glass space-y-5 rounded-[var(--radius-panel)] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SeverityBadge severity={conflict.severity} />
          <h3 className="font-display text-xl font-medium text-ink">{conflict.headline}</h3>
          <p className="text-sm text-muted">{conflict.summary}</p>
        </div>
        {detailedLink && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/events/${conflict.targetEventId}/conflicts`}>
              Full details <ArrowRight />
            </Link>
          </Button>
        )}
      </div>

      {showTimeline && (
        <ConflictTimeline
          yourEvent={conflict.yourEvent}
          competingEvent={conflict.competingEvent}
          overlapMinutes={conflict.overlapMinutes}
          overlapWindow={conflict.overlapWindow}
        />
      )}

      <div className="space-y-2.5">
        <h4 className="text-sm font-semibold text-ink">Why this was flagged</h4>
        {conflict.reasons.map((r, i) => (
          <ConflictReason key={r.id} reason={r} index={i} />
        ))}
      </div>

      {showSuggestions && conflict.suggestedSlots.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-sm font-semibold text-ink">Free time slots</h4>
          {conflict.suggestedSlots.map((s) => (
            <SuggestedSlot key={s.id} slot={s} onSelect={onApplySlot} />
          ))}
        </div>
      )}
    </div>
  );
}
