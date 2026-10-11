import { PrismaClient } from " @prisma/client\;
import { z } from \zod\;
import { parseISO } from \date-fns\;

// Prisma singleton (or import from lib/backend/prisma.ts)
export const prisma = new PrismaClient();

// Zod schema for event input validation
export const EventInputSchema = z.object({
 id: z.string().optional(),
 title: z.string().min(1),
 start: z.string().refine((s) => !isNaN(Date.parse(s)), { message: \Invalid start date\ }),
 end: z.string().refine((s) => !isNaN(Date.parse(s)), { message: \Invalid end date\ }),
 venueId: z.string().min(1),
 budget: z.number().nonnegative(),
});
export type EventInput = z.infer<typeof EventInputSchema>;

/**
 * Detect venue conflicts for a given event.
 * Returns an array of conflicting event IDs.
 */
export async function detectVenueConflicts(event: EventInput): Promise<string[]> {
 const start = parseISO(event.start);
 const end = parseISO(event.end);

 const conflicts = await prisma.event.findMany({
 where: {
 venueId: event.venueId,
 AND: [
 { start: { lt: end } },
 { end: { gt: start } },
 ],
 },
 select: { id: true },
 });
 return conflicts.map((c) => c.id);
}

/**
 * Aggregate total budget for a set of event IDs.
 */
export async function aggregateBudget(eventIds: string[]): Promise<number> {
 const events = await prisma.event.findMany({
 where: { id: { in: eventIds } },
 select: { budget: true },
 });
 return events.reduce((sum, e) => sum + (e.budget ?? 0), 0);
}

/**
 * Public API entry point – validates the payload, checks for conflicts,
 * and returns the list of conflicts plus the cumulative budget.
 */
export async function checkEvent(event: EventInput) {
 const parsed = EventInputSchema.parse(event);
 const conflicts = await detectVenueConflicts(parsed);
 const allIds = [...conflicts];
 if (parsed.id) allIds.push(parsed.id);
 const totalBudget = await aggregateBudget(allIds);
 return { conflicts, totalBudget };
}
