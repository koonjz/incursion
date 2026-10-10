import React from "react";
import { Metadata } from "next";
import { VerificationQueueView } from "@/components/verification/VerificationQueueView";

export const metadata: Metadata = {
  title: "Review queue | ACM Resolve",
  description: "Review proposed events before they go on the campus calendar.",
};

export default function VerificationPage() {
  return <VerificationQueueView />;
}
