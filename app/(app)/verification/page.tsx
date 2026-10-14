import React from "react";
import { Metadata } from "next";
import { VerificationQueueView } from "@/components/verification/VerificationQueueView";
import { getAllCampusEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Review queue | ACM Resolve",
  description: "Review proposed events before they go on the campus calendar.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VerificationPage() {
  const events = await getAllCampusEvents();
  return <VerificationQueueView initialEvents={events} />;
}
