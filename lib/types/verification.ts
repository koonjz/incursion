import { CampusEvent } from "./event";
import { EventConflict } from "./conflict";

export interface VerificationQueueStats {
  pendingCount: number;
  highConflictsCount: number;
  changesRequestedCount: number;
  totalUnderReview: number;
}

export interface VerificationItem {
  event: CampusEvent;
  conflict?: EventConflict;
  priority: "high" | "medium" | "standard";
  assignedTo?: string;
  daysInQueue: number;
}
