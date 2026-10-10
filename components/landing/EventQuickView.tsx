"use client";

import React from "react";
import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fact, TagList } from "@/components/shared/Facts";
import { formatLongDate, formatTime } from "@/lib/utils";
import type { CampusEvent } from "@/lib/types/event";

export function EventQuickView({
  event,
  onOpenChange,
}: {
  event: CampusEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent>
        {event && (
          <>
            <DialogHeader>
              <div>
                <Badge>{event.eventType}</Badge>
              </div>
              <DialogTitle>{event.title}</DialogTitle>
              <DialogDescription>
                {formatLongDate(event.date)} · hosted by {event.organizer}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <Fact icon={<Clock />} label="Time">
                {formatTime(event.startTime)} – {formatTime(event.endTime)}
              </Fact>
              <Fact icon={<MapPin />} label="Venue">
                {event.venue}
              </Fact>
              <Fact icon={<Users />} label="Expected">
                {event.expectedAttendance} people
              </Fact>
            </div>

            <p className="text-[15px] leading-relaxed text-body">{event.description}</p>

            <div className="space-y-2">
              <p className="text-xs text-muted">Open to</p>
              <TagList tags={event.audience} />
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Sign in to manage events and see review details.</p>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
