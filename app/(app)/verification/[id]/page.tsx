import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import { mapPrismaEventToCampusEvent } from "@/lib/events";
import { MOCK_CONFLICTS } from "@/lib/mock/conflicts";
import { VerificationDetailWorkspace } from "@/components/verification/VerificationDetailWorkspace";
import { Metadata } from "next";

interface VerificationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VerificationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const dbEvent = await prisma.event.findUnique({
    where: { id },
  }).catch(() => null);

  if (!dbEvent) return { title: "Verification Workspace | ACM Resolve" };
  return {
    title: `Review: ${dbEvent.title} | ACM Resolve`,
    description: `Review workspace for ${dbEvent.title}.`,
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VerificationDetailPage({ params }: VerificationDetailPageProps) {
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
  const conflict = (event.conflictId && MOCK_CONFLICTS[event.conflictId]) || null;

  return <VerificationDetailWorkspace event={event} conflict={conflict} />;
}
