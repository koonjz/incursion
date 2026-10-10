import { SeverityBadge } from "./SeverityBadge";
import type { ConflictSeverity } from "@/lib/types/event";

export function ConflictBadge({ severity, className }: { severity: ConflictSeverity; count?: number; className?: string }) {
  return <SeverityBadge severity={severity} className={className} />;
}
