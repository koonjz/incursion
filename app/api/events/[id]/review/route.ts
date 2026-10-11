import { NextRequest } from "next/server";
import {
  errorResponse,
  jsonResponse,
  requireRole,
} from "@/src/modules/auth/rbac";
import { reviewEvent } from "@/src/modules/events/eventsService";
import { reviewEventSchema } from "@/src/modules/events/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/events/[id]/review
 * Submit a review decision (APPROVED, REJECTED, CHANGES_REQUESTED).
 * Restricted to ADMIN and HOD roles.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const reviewer = await requireRole(["ADMIN", "HOD"], req);
    const { id } = await params;

    const body = await req.json();
    const parsed = reviewEventSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.format());
    }

    const result = await reviewEvent(id, parsed.data, reviewer);
    return jsonResponse(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "FORBIDDEN") return errorResponse("Only Admins and HODs can review events", 403);
      if (err.message === "NOT_FOUND") return errorResponse("Event not found", 404);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
