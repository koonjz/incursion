"use client";

import { useEffect, useRef } from "react";
import { Calendar, type EventContentArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export interface BoardEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  classNames: string[];
  sub: string;
}

/**
 * FullCalendar driven through its core `Calendar` class.
 * The project pins @fullcalendar/react v7 next to core/plugins v6, and that
 * wrapper crashes ("Class constructor DayTableView cannot be invoked without
 * 'new'"). Using the core API directly needs no extra packages.
 */
export function CalendarBoard({
  events,
  initialDate,
  onEventClick,
}: {
  events: BoardEvent[];
  initialDate: string;
  onEventClick: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const cal = useRef<Calendar | null>(null);
  const clickRef = useRef(onEventClick);
  const eventsRef = useRef(events);

  useEffect(() => {
    clickRef.current = onEventClick;
  }, [onEventClick]);

  // Create once.
  useEffect(() => {
    if (!host.current) return;
    const calendar = new Calendar(host.current, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      initialDate,
      headerToolbar: { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" },
      events: eventsRef.current,
      editable: false,
      dayMaxEvents: 3,
      height: "auto",
      aspectRatio: 1.75,
      eventClick: (info) => {
        info.jsEvent.preventDefault();
        clickRef.current(info.event.id);
      },
      eventContent: (arg: EventContentArg) => {
        const wrap = document.createElement("div");
        wrap.className = "fc-chip-body";
        const title = document.createElement("p");
        title.className = "fc-chip-title";
        title.textContent = arg.event.title;
        const sub = document.createElement("p");
        sub.className = "fc-chip-sub";
        sub.textContent = String(arg.event.extendedProps.sub ?? "");
        wrap.append(title, sub);
        return { domNodes: [wrap] };
      },
    });
    calendar.render();
    cal.current = calendar;
    return () => {
      calendar.destroy();
      cal.current = null;
    };
  }, [initialDate]);

  // Swap events when filters change.
  useEffect(() => {
    eventsRef.current = events;
    const calendar = cal.current;
    if (!calendar) return;
    calendar.batchRendering(() => {
      calendar.removeAllEventSources();
      calendar.addEventSource(events);
    });
  }, [events]);

  return <div ref={host} className="min-h-[560px]" />;
}
