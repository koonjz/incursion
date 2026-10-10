import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "./SeverityBadge";
import { cn } from "@/lib/utils";
import type { ConflictSeverity } from "@/lib/types/event";

interface ConflictSummaryProps {
  eventId: string;
  severity: ConflictSeverity;
  conflictId?: string;
  summaryText?: string;
  showActions?: boolean;
  className?: string;
}

const TONE: Record<string, string> = {
  critical: "border-rose-400/25 bg-rose-400/10",
  high: "border-orange-400/25 bg-orange-400/10",
  medium: "border-amber-400/25 bg-amber-400/10",
  low: "border-white/10 bg-white/[0.06]",
};

export function ConflictSummary({
  eventId,
  severity,
  summaryText = "Possible scheduling overlap detected.",
  showActions = true,
  className,
}: ConflictSummaryProps) {
  if (severity === "none") {
    return (
      <div className={cn("flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4", className)}>
        <CheckCircle2 className="size-5 shrink-0 text-emerald-300" />
        <div>
          <p className="text-sm font-medium text-emerald-200">No conflicts</p>
          <p className="text-sm text-emerald-300/80">The venue and time slot are free.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-2xl border p-4", TONE[severity] ?? TONE.low, className)}>
      <div className="space-y-2">
        <SeverityBadge severity={severity} />
        <p className="text-sm text-ink">{summaryText}</p>
      </div>
      {showActions && (
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/events/${eventId}`}>
              <Eye /> View event
            </Link>
          </Button>
          <Button asChild size="sm" variant={severity === "critical" || severity === "high" ? "destructive" : "default"}>
            <Link href={`/events/${eventId}/conflicts`}>
              See conflict details <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
