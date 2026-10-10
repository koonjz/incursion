import React from "react";
import { Metadata } from "next";
import { EventSubmissionForm } from "@/components/events/EventSubmissionForm";

export const metadata: Metadata = {
  title: "Submit event | ACM Resolve",
  description: "Submit an event and check for scheduling conflicts as you go.",
};

export default function NewEventPage() {
  return <EventSubmissionForm />;
}
