import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/events";
import type { EventStatus } from "@/lib/types/event";

const VARIANT = {
  approved: "approved",
  pending: "pending",
  draft: "draft",
  changes_requested: "changesRequested",
  rejected: "rejected",
} as const;

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  return (
    <Badge variant={VARIANT[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
