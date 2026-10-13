import React from "react";
import { Metadata } from "next";
import { MySubmissionsView } from "@/components/events/MySubmissionsView";
import { getAllCampusEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "My submissions | ACM Resolve",
  description: "Track your event submissions, review status and conflicts.",
};

export default async function MySubmissionsPage() {
  const events = await getAllCampusEvents();
  return <MySubmissionsView initialEvents={events} />;
}
