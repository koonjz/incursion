import React from "react";
import { Metadata } from "next";
import { CampusCalendar } from "@/components/calendar/CampusCalendar";
import { getAllCampusEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Calendar | ACM Resolve",
  description: "Every campus event in one calendar, with conflicts highlighted.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CalendarPage() {
  const events = await getAllCampusEvents();
  return <CampusCalendar initialEvents={events} />;
}
