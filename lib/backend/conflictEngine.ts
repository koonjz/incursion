import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { parseISO } from "date-fns";

export const prisma = new PrismaClient();

export const EventInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  start: z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid start date" }),
  end: z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid end date" }),
  venueId: z.string().min(1),
  budget: z.number().nonnegative(),
});
export type EventInput = z.infer<typeof EventInputSchema>;

export async function detectVenueConflicts(event: EventInput): Promise<string[]> {
  const start = parseISO(event.start);
  const end = parseISO(event.end);

  try {
    const conflicts = await prisma.event.findMany({
      where: {
        venueId: event.venueId,
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
      select: { id: true },
    });
    return conflicts.map((c) => c.id);
  } catch {
    return [];
  }
}

export async function aggregateBudget(eventIds: string[]): Promise<number> {
  try {
    const expenses = await prisma.expense.findMany({
      where: { id: { in: eventIds } },
      select: { amount: true },
    });
    return expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  } catch {
    return 0;
  }
}

export async function checkEvent(event: EventInput) {
  const parsed = EventInputSchema.parse(event);
  const conflicts = await detectVenueConflicts(parsed);
  const allIds = [...conflicts];
  if (parsed.id) allIds.push(parsed.id);
  const totalBudget = await aggregateBudget(allIds);
  return { conflicts, totalBudget };
}
