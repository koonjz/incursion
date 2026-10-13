import React from "react";
import { Metadata } from "next";
import { VerificationQueueView } from "@/components/verification/VerificationQueueView";
import { getAllCampusEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Review queue | ACM Resolve",
  description: "Review proposed events before they go on the campus calendar.",
};

export default async function VerificationPage() {
  const events = await getAllCampusEvents();
  return <VerificationQueueView initialEvents={events} />;
}
