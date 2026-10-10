"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, MapPin, ShieldCheck, Users } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import { ConflictTimeline } from "./ConflictTimeline";
import { SuggestedSlot } from "./SuggestedSlot";
import { cn, formatTime } from "@/lib/utils";
import type { EventConflict, SuggestedSlot as SuggestedSlotType } from "@/lib/types/conflict";

interface ConflictPanelProps {
  conflict: EventConflict | null;
  onSelectSlot?: (slot: SuggestedSlotType) => void;
  selectedSlotId?: string;
  className?: string;
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2.5">
        {ok ? (
          <CheckCircle2 className="size-[18px] shrink-0 text-emerald-400" />
        ) : (
          <AlertTriangle className="size-[18px] shrink-0 text-amber-400" />
        )}
        <span className={cn("font-medium", ok ? "text-ink" : "text-amber-200")}>{label}</span>
      </span>
      {detail && <span className="truncate text-right text-xs text-muted">{detail}</span>}
    </li>
  );
}

export function ConflictPanel({ conflict, onSelectSlot, selectedSlotId, className }: ConflictPanelProps) {
  const shell = cn("glass space-y-5 rounded-[var(--radius-panel)] p-5 sm:p-6 lg:sticky lg:top-0", className);

  if (!conflict) {
    return (
      <aside className={shell} aria-live="polite">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">Conflict check</h3>
            <p className="text-sm text-muted">Updates as you change the details.</p>
          </div>
          <SeverityBadge severity="none" />
        </div>
        <ul className="divide-y divide-white/10">
          <Check ok label="Venue is free" />
          <Check ok label="Organizer is free" />
          <Check ok label="No audience overlap" />
          <Check ok label="Time slot is clear" />
        </ul>
        <p className="rounded-2xl bg-emerald-400/10 p-4 text-sm text-emerald-200">
          Nothing clashes with this time and venue. Your event goes straight to the ACM Core review queue.
        </p>
        <p className="flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0" /> ACM Core makes the final scheduling decision.
        </p>
      </aside>
    );
  }

  return (
    <aside className={shell} aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">Conflict check</h3>
          <p className="text-sm text-muted">Updates as you change the details.</p>
        </div>
        <SeverityBadge severity={conflict.severity} />
      </div>

      <ul className="divide-y divide-white/10">
        <Check
          ok={conflict.checks.venueAvailable}
          label={conflict.checks.venueAvailable ? "Venue is free" : "Venue is booked"}
          detail={conflict.yourEvent.venue}
        />
        <Check ok={conflict.checks.organizerAvailable} label="Organizer is free" />
        <Check
          ok={conflict.checks.audienceClear}
          label={conflict.checks.audienceClear ? "No audience overlap" : "Audience overlap"}
          detail={conflict.yourEvent.audience?.join(", ")}
        />
        <Check
          ok={conflict.checks.timeClear}
          label={conflict.checks.timeClear ? "Time slot is clear" : "Time overlap"}
          detail={conflict.overlapWindow}
        />
      </ul>

      <div className="glass-inset space-y-1.5 rounded-2xl p-4">
        <p className="text-xs text-muted">
          Clashes with · {formatTime(conflict.competingEvent.startTime)} – {formatTime(conflict.competingEvent.endTime)}
        </p>
        <h4 className="text-[15px] font-semibold leading-snug text-ink">{conflict.competingEvent.title}</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {conflict.competingEvent.venue}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> ~{conflict.competingEvent.expectedAttendance} people
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-ink">Why this was flagged</h4>
        <ul className="space-y-1.5 text-sm text-body">
          {conflict.reasons.map((r) => (
            <li key={r.id} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-400" />
              <span>{r.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <ConflictTimeline
        yourEvent={conflict.yourEvent}
        competingEvent={conflict.competingEvent}
        overlapMinutes={conflict.overlapMinutes}
        overlapWindow={conflict.overlapWindow}
      />

      {conflict.suggestedSlots.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold text-ink">Free time slots</h4>
            <span className="text-xs text-muted">Tap to apply</span>
          </div>
          {conflict.suggestedSlots.map((slot) => (
            <SuggestedSlot key={slot.id} slot={slot} selected={selectedSlotId === slot.id} onSelect={onSelectSlot} />
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted">
        <ShieldCheck className="size-4 shrink-0" /> ACM Core makes the final scheduling decision.
      </p>
    </aside>
  );
}
