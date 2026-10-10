import { AlertCircle, Clock, MapPin, Tag, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConflictReason as ConflictReasonType } from "@/lib/types/conflict";

interface ConflictReasonProps {
  reason: ConflictReasonType;
  index?: number;
  compact?: boolean;
}

const ICONS = {
  TIME_OVERLAP: Clock,
  SAME_VENUE: MapPin,
  AUDIENCE_OVERLAP: Users,
  SIMILAR_TYPE: Tag,
  CAPACITY_OVERLOAD: AlertCircle,
} as const;

const TONE: Record<string, string> = {
  critical: "bg-rose-400/15 text-rose-300",
  high: "bg-orange-400/15 text-orange-300",
  medium: "bg-amber-400/15 text-amber-300",
  low: "bg-white/8 text-slate-300",
  none: "bg-emerald-400/15 text-emerald-300",
};

export function ConflictReason({ reason, compact = false }: ConflictReasonProps) {
  const Icon = ICONS[reason.code] ?? AlertCircle;

  if (compact) {
    return (
      <p className="text-sm text-body">
        <span className="font-medium text-ink">{reason.title}.</span> {reason.detail}
      </p>
    );
  }

  return (
    <div className="glass-inset flex gap-3.5 rounded-2xl p-4">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-[18px]", TONE[reason.severity] ?? TONE.low)}>
        <Icon />
      </span>
      <div className="min-w-0 space-y-1">
        <h4 className="text-[15px] font-semibold text-ink">{reason.title}</h4>
        <p className="text-sm leading-relaxed text-body">{reason.detail}</p>
      </div>
    </div>
  );
}
