import { NextRequest } from "next/server";
import {
  errorResponse,
  jsonResponse,
  requireAuth,
} from "@/src/modules/auth/rbac";
import {
  createEvent,
  listEvents,
} from "@/src/modules/events/eventsService";
import { createEventSchema } from "@/src/modules/events/validation";
import { EventStatus } from "@prisma/client";

/**
 * GET /api/events
 * List and filter events by date range, venue, status, organizer
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const venueId = searchParams.get("venueId") || undefined;
    const status = (searchParams.get("status") as EventStatus) || undefined;
    const organizerId = searchParams.get("organizerId") || undefined;
    const search = searchParams.get("search") || undefined;

    const events = await listEvents({
      from,
      to,
      venueId,
      status,
      organizerId,
      search,
    });

    return jsonResponse(events);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch events";
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/events
 * Create a new event, run conflict detection, save conflict logs, send notification.
 * Blocks if CRITICAL conflict exists unless overridden.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.format());
    }

    try {
      const result = await createEvent(parsed.data, user);
      return jsonResponse(result, 201);
    } catch (createErr: unknown) {
      if (createErr instanceof Error && createErr.message === "CRITICAL_CONFLICT_BLOCKED") {
        const errorData = createErr as unknown as {
          conflicts: unknown[];
          suggestedSlots: unknown[];
        };
        return errorResponse(
          "Event creation blocked due to critical scheduling conflict. Please choose another time or venue.",
          409,
          {
            conflicts: errorData.conflicts,
            suggestedSlots: errorData.suggestedSlots,
          }
        );
      }
      throw createErr;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Insufficient permissions", 403);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
