import React from "react";
import { Metadata } from "next";
import { DashboardOverviewView } from "@/components/events/DashboardOverviewView";

export const metadata: Metadata = {
  title: "Overview | ACM Resolve",
  description: "See upcoming events, pending reviews and conflicts across campus.",
};

export default function DashboardPage() {
  return <DashboardOverviewView />;
}
