import React from "react";
import { Metadata } from "next";
import { MySubmissionsView } from "@/components/events/MySubmissionsView";

export const metadata: Metadata = {
  title: "My submissions | ACM Resolve",
  description: "Track your event submissions, review status and conflicts.",
};

export default function MySubmissionsPage() {
  return <MySubmissionsView />;
}
