"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Eye, MapPin, Plus, RotateCcw, ShieldAlert, Users } from "lucide-react";
import { MOCK_EVENTS, MOCK_CLUBS, MOCK_VENUES } from "@/lib/mock/events";
import { ConflictSummary } from "@/components/conflicts/ConflictSummary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CalendarBoard, type BoardEvent } from "./CalendarBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Fact, TagList } from "@/components/shared/Facts";
import { AUDIENCE_OPTIONS, EVENT_TYPE_OPTIONS } from "@/lib/events";
import { cn, formatLongDate, formatTime } from "@/lib/utils";
import type { CampusEvent } from "@/lib/types/event";

const LEGEND = [
  { label: "Approved", dot: "bg-emerald-500" },
  { label: "In review", dot: "bg-blue-500" },
  { label: "Possible conflict", dot: "bg-amber-500" },
  { label: "Serious conflict", dot: "bg-rose-500" },
];

function chipClass(e: CampusEvent) {
  if (e.conflictSeverity === "critical" || e.conflictSeverity === "high") return "fc-chip fc-chip-high";
  if (e.conflictSeverity === "medium") return "fc-chip fc-chip-medium";
  if (e.status === "approved") return "fc-chip fc-chip-approved";
  return "fc-chip";
}

export function CampusCalendar() {
  const [selected, setSelected] = useState<CampusEvent | null>(null);
  const [club, setClub] = useState("all");
  const [type, setType] = useState("all");
  const [venue, setVenue] = useState("all");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState("all");
  const [conflictOnly, setConflictOnly] = useState(false);

  const filtersActive = club !== "all" || type !== "all" || venue !== "all" || audience !== "all" || status !== "all" || conflictOnly;

  const filtered = useMemo(
    () =>
      MOCK_EVENTS.filter((e) => {
        if (club !== "all" && e.club !== club && e.organizer !== club) return false;
        if (type !== "all" && e.eventType !== type) return false;
        if (venue !== "all" && !e.venue.includes(venue)) return false;
        if (audience !== "all" && !e.audience.includes(audience)) return false;
        if (status !== "all" && e.status !== status) return false;
        if (conflictOnly && e.conflictSeverity === "none") return false;
        return true;
      }),
    [club, type, venue, audience, status, conflictOnly]
  );

  const calendarEvents = useMemo<BoardEvent[]>(
    () =>
      filtered.map((e) => ({
        id: e.id,
        title: e.title,
        start: `${e.date}T${e.startTime}:00`,
        end: `${e.date}T${e.endTime}:00`,
        classNames: chipClass(e).split(" "),
        sub: `${formatTime(e.startTime)} · ${e.venue}`,
      })),
    [filtered]
  );

  const reset = () => {
    setClub("all");
    setType("all");
    setVenue("all");
    setAudience("all");
    setStatus("all");
    setConflictOnly(false);
  };

  const onEventClick = (id: string) => {
    const original = MOCK_EVENTS.find((e) => e.id === id);
    if (original) setSelected(original);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus calendar"
        description="Everything happening across campus, with conflicts highlighted."
        actions={
          <Button asChild>
            <Link href="/events/new">
              <Plus /> Submit event
            </Link>
          </Button>
        }
      />

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            Showing <span className="font-semibold text-ink">{filtered.length}</span> of {MOCK_EVENTS.length} events
          </p>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw /> Reset filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <div>
            <Label htmlFor="f-club" className="text-xs text-muted">Club</Label>
            <NativeSelect id="f-club" value={club} onChange={(e) => setClub(e.target.value)}>
              <option value="all">All clubs</option>
              {MOCK_CLUBS.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="f-type" className="text-xs text-muted">Type</Label>
            <NativeSelect id="f-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              {EVENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="f-venue" className="text-xs text-muted">Venue</Label>
            <NativeSelect id="f-venue" value={venue} onChange={(e) => setVenue(e.target.value)}>
              <option value="all">All venues</option>
              {MOCK_VENUES.map((v) => (
                <option key={v.id} value={v.name.split(" ")[0]}>{v.name}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="f-aud" className="text-xs text-muted">Audience</Label>
            <NativeSelect id="f-aud" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="all">Everyone</option>
              {AUDIENCE_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="f-status" className="text-xs text-muted">Status</Label>
            <NativeSelect id="f-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Any status</option>
              <option value="approved">Approved</option>
              <option value="pending">In review</option>
              <option value="changes_requested">Changes requested</option>
              <option value="draft">Draft</option>
            </NativeSelect>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              aria-pressed={conflictOnly}
              onClick={() => setConflictOnly((v) => !v)}
              className={cn(
                "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors duration-200",
                conflictOnly
                  ? "border-amber-400/35 bg-amber-400/10 text-amber-200"
                  : "border-white/14 bg-white/[0.06] text-body hover:border-white/25 hover:bg-white/10"
              )}
            >
              <ShieldAlert className="size-4" /> Conflicts only
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <ul className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted" aria-label="Legend">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", l.dot)} />
              {l.label}
            </li>
          ))}
        </ul>

        <CalendarBoard events={calendarEvents} initialDate="2026-10-15" onEventClick={onEventClick} />
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right">
          {selected && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge>{selected.eventType}</Badge>
                  <StatusBadge status={selected.status} />
                </div>
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>Hosted by {selected.organizer}</SheetDescription>
              </SheetHeader>

              <div className="glass-inset grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
                <Fact icon={<CalendarDays />} label="Date">{formatLongDate(selected.date)}</Fact>
                <Fact icon={<Clock />} label="Time">
                  {formatTime(selected.startTime)} – {formatTime(selected.endTime)}
                </Fact>
                <Fact icon={<MapPin />} label="Venue">{selected.venue}</Fact>
                <Fact icon={<Users />} label="Expected guests">{selected.expectedAttendance} people</Fact>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted">Open to</p>
                <TagList tags={selected.audience} />
              </div>

              <p className="text-[15px] leading-relaxed text-body">{selected.description}</p>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">Conflict check</p>
                <ConflictSummary
                  eventId={selected.id}
                  severity={selected.conflictSeverity}
                  conflictId={selected.conflictId}
                  summaryText={selected.conflictSeverity !== "none" ? "This event overlaps with another one." : undefined}
                  showActions={selected.conflictSeverity !== "none"}
                />
              </div>

              <Button asChild className="w-full">
                <Link href={`/events/${selected.id}`}>
                  <Eye /> View full details
                </Link>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
