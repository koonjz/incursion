import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_LABEL } from "@/lib/events";
import type { ConflictSeverity } from "@/lib/types/event";

interface SeverityBadgeProps {
  severity: ConflictSeverity;
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  className?: string;
}

const ICON = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  none: CheckCircle2,
} as const;

export function SeverityBadge({ severity, size = "default", showIcon = true, className }: SeverityBadgeProps) {
  const Icon = ICON[severity] ?? Info;
  return (
    <Badge variant={severity} className={`${size === "lg" ? "px-3 py-1 text-sm" : ""} ${className ?? ""}`}>
      {showIcon && <Icon className="size-3.5 shrink-0" />}
      {SEVERITY_LABEL[severity] ?? "Unknown"}
    </Badge>
  );
}
