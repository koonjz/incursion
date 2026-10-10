import { ArrowRight, Check, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SuggestedSlot as SuggestedSlotType } from "@/lib/types/conflict";

interface SuggestedSlotProps {
  slot: SuggestedSlotType;
  onSelect?: (slot: SuggestedSlotType) => void;
  selected?: boolean;
  compact?: boolean;
}

export function SuggestedSlot({ slot, onSelect, selected = false, compact = false }: SuggestedSlotProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(slot)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
          selected ? "border-blue-500 bg-blue-600 text-white" : "border-white/14 bg-white/[0.06] text-ink hover:border-blue-400/60"
        )}
      >
        <Clock className="size-3.5" />
        {slot.startTimeFormatted} – {slot.endTimeFormatted}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 sm:flex-row sm:items-center sm:justify-between",
        selected
          ? "border-blue-500 bg-white/5 shadow-[0_0_0_3px_rgba(79,115,180,0.18)]"
          : "border-white/10 bg-white/[0.06] hover:border-white/25"
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[15px] font-semibold text-ink">
            {slot.startTimeFormatted} – {slot.endTimeFormatted}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <MapPin className="size-3.5" />
            {slot.venue}
          </span>
          {slot.isRecommended && (
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-medium text-emerald-300">Recommended</span>
          )}
        </div>
        <p className="text-sm text-muted">{slot.rationale}</p>
      </div>

      {onSelect && (
        <Button
          type="button"
          size="sm"
          variant={selected ? "default" : "outline"}
          onClick={() => onSelect(slot)}
          className="shrink-0"
        >
          {selected ? (
            <>
              <Check /> Selected
            </>
          ) : (
            <>
              Use this slot <ArrowRight />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
