import React from "react";
import { Metadata } from "next";
import { DashboardOverviewView } from "@/components/events/DashboardOverviewView";
import { getAllCampusEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Overview | ACM Resolve",
  description: "See upcoming events, pending reviews and conflicts across campus.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const events = await getAllCampusEvents();
  return <DashboardOverviewView initialEvents={events} />;
}
