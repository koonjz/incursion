import React from "react";
import { notFound } from "next/navigation";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { ConflictAnalysisView } from "@/components/conflicts/ConflictAnalysisView";
import { Metadata } from "next";

export async function generateStaticParams() {
  return MOCK_EVENTS.map((event) => ({
    id: event.id,
  }));
}

interface ConflictPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ConflictPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return { title: "Conflict Analysis | ACM Resolve" };
  return {
    title: `Conflicts: ${event.title} | ACM Resolve`,
    description: `Conflict details and free time slots.`,
  };
}

export default async function EventConflictsPage({ params }: ConflictPageProps) {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);

  if (!event) {
    notFound();
  }

  // Get associated conflict or fallback to cnf-201
  const conflict = (event.conflictId && MOCK_CONFLICTS[event.conflictId]) || MOCK_CONFLICTS["cnf-201"];

  return <ConflictAnalysisView event={event} conflict={conflict} />;
}
