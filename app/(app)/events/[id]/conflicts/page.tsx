import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { mapPrismaEventToCampusEvent } from "@/lib/events";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { ConflictAnalysisView } from "@/components/conflicts/ConflictAnalysisView";
import { Metadata } from "next";

interface ConflictPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ConflictPageProps): Promise<Metadata> {
  const { id } = await params;
  const dbEvent = await prisma.event.findUnique({
    where: { id },
  }).catch(() => null);

  if (!dbEvent) return { title: "Conflict Analysis | ACM Resolve" };
  return {
    title: `Conflicts: ${dbEvent.title} | ACM Resolve`,
    description: `Conflict details and free time slots.`,
  };
}

export default async function EventConflictsPage({ params }: ConflictPageProps) {
  const { id } = await params;
  const dbEvent = await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      organizer: true,
      conflictLogs: true,
      reviews: { include: { reviewer: true } },
    },
  }).catch(() => null);

  if (!dbEvent) {
    notFound();
  }

  const event = mapPrismaEventToCampusEvent(dbEvent);

  const conflict = (event.conflictId && MOCK_CONFLICTS[event.conflictId]) || MOCK_CONFLICTS["cnf-201"];

  return <ConflictAnalysisView event={event} conflict={conflict} />;
}
