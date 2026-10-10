import React from "react";
import { notFound } from "next/navigation";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { EventDetailsView } from "@/components/events/EventDetailsView";
import { Metadata } from "next";

export async function generateStaticParams() {
  return MOCK_EVENTS.map((event) => ({
    id: event.id,
  }));
}

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return { title: "Event Not Found | ACM Resolve" };
  return {
    title: `${event.title} | ACM Resolve`,
    description: `${event.organizer} - ${event.venue} on ${event.date}`,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);

  if (!event) {
    notFound();
  }

  return <EventDetailsView event={event} />;
}
