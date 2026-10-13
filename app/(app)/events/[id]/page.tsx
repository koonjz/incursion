import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { mapPrismaEventToCampusEvent } from "@/lib/events";
import { EventDetailsView } from "@/components/events/EventDetailsView";
import { Metadata } from "next";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const dbEvent = await prisma.event.findUnique({
    where: { id },
    include: { venue: true, organizer: true },
  }).catch(() => null);

  if (!dbEvent) return { title: "Event Not Found | ACM Resolve" };
  return {
    title: `${dbEvent.title} | ACM Resolve`,
    description: `${dbEvent.organizer.name} - ${dbEvent.venue.name}`,
  };
}

export default async function EventPage({ params }: EventPageProps) {
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
  return <EventDetailsView event={event} />;
}
