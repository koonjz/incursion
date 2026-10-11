import { NextRequest } from "next/server";
import {
  errorResponse,
  jsonResponse,
  requireAuth,
} from "@/src/modules/auth/rbac";
import {
  deleteEvent,
  getEventById,
  updateEvent,
} from "@/src/modules/events/eventsService";
import { updateEventSchema } from "@/src/modules/events/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    return jsonResponse(event);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch event";
    return errorResponse(message, 500);
  }
}

/**
 * PATCH /api/events/[id]
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.format());
    }

    const result = await updateEvent(id, parsed.data, user);
    return jsonResponse(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Insufficient permissions", 403);
      if (err.message === "NOT_FOUND") return errorResponse("Event not found", 404);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/events/[id]
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    await deleteEvent(id, user);
    return jsonResponse({ deleted: true, id });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Insufficient permissions", 403);
      if (err.message === "NOT_FOUND") return errorResponse("Event not found", 404);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
