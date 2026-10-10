import React from "react";
import { notFound } from "next/navigation";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { EventEditView } from "@/components/events/EventEditView";
import { Metadata } from "next";

export async function generateStaticParams() {
  return MOCK_EVENTS.map((event) => ({
    id: event.id,
  }));
}

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditEventPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return { title: "Edit Event | ACM Resolve" };
  return {
    title: `Edit ${event.title} | ACM Resolve`,
    description: `Edit event details with a live conflict check.`,
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);

  if (!event) {
    notFound();
  }

  return <EventEditView event={event} />;
}
