import { prisma } from "@/src/lib/prisma";
import { ConflictResult } from "./types";
import { ConflictType, Severity } from "@prisma/client";

export interface LogConflictInput {
  eventId: string;
  conflicts: ConflictResult[];
}

/**
 * Logs detected conflicts to the database.
 */
export async function logConflicts(
  eventId: string,
  conflicts: ConflictResult[]
) {
  if (conflicts.length === 0) return [];

  const createdLogs = [];
  for (const c of conflicts) {
    try {
      const log = await prisma.conflictLog.create({
        data: {
          eventId,
          conflictType: c.type as ConflictType,
          severity: c.severity as Severity,
          score: c.score || 0,
          details: {
            message: c.message,
            overlapMinutes: c.overlapMinutes,
            conflictingEventId: c.conflictingEventId,
          },
        },
      });
      createdLogs.push(log);
    } catch (err) {
      console.error("Failed to persist conflict log:", err);
    }
  }

  return createdLogs;
}

/**
 * Marks a conflict as resolved.
 */
export async function resolveConflict(
  conflictId: string,
  resolvedById: string,
  resolutionNotes?: string
) {
  return await prisma.conflictLog.update({
    where: { id: conflictId },
    data: {
      resolvedAt: new Date(),
      resolvedById,
      details: resolutionNotes ? { resolutionNotes } : undefined,
    },
    include: {
      resolvedBy: true,
      event: true,
    },
  });
}

/**
 * Retrieves full conflict history for an event.
 */
export async function getConflictHistory(eventId: string) {
  return await prisma.conflictLog.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    include: {
      resolvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
