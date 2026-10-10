import React from "react";
import { notFound } from "next/navigation";
import { MOCK_EVENTS } from "@/lib/mock/events";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { VerificationDetailWorkspace } from "@/components/verification/VerificationDetailWorkspace";
import { Metadata } from "next";

export async function generateStaticParams() {
  return MOCK_EVENTS.map((event) => ({
    id: event.id,
  }));
}

interface VerificationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VerificationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return { title: "Verification Workspace | ACM Resolve" };
  return {
    title: `Review: ${event.title} | ACM Resolve`,
    description: `Review workspace for ${event.title}.`,
  };
}

export default async function VerificationDetailPage({ params }: VerificationDetailPageProps) {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);

  if (!event) {
    notFound();
  }

  const conflict = (event.conflictId && MOCK_CONFLICTS[event.conflictId]) || null;

  return <VerificationDetailWorkspace event={event} conflict={conflict} />;
}
