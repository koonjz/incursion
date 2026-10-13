import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { mapPrismaEventToCampusEvent } from "@/lib/events";
import { EventEditView } from "@/components/events/EventEditView";
import { Metadata } from "next";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditEventPageProps): Promise<Metadata> {
  const { id } = await params;
  const dbEvent = await prisma.event.findUnique({
    where: { id },
  }).catch(() => null);

  if (!dbEvent) return { title: "Edit Event | ACM Resolve" };
  return {
    title: `Edit ${dbEvent.title} | ACM Resolve`,
    description: `Edit event details with a live conflict check.`,
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
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
  return <EventEditView event={event} />;
}
