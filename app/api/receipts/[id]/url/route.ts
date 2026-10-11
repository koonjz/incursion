import { NextRequest } from "next/server";
import {
  errorResponse,
  jsonResponse,
  requireAuth,
} from "@/src/modules/auth/rbac";
import { getReceiptDownloadUrl } from "@/src/modules/receipts/receiptService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/receipts/[id]/url
 * Returns short-lived signed download URL for receipt document.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth(req);
    const { id } = await params;

    const result = await getReceiptDownloadUrl(id);
    return jsonResponse(result);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return errorResponse("Authentication required", 401);
      if (err.message === "RECEIPT_NOT_FOUND") return errorResponse("Receipt not found", 404);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
