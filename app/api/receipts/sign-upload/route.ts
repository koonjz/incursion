import { NextRequest } from "next/server";
import {
  errorResponse,
  jsonResponse,
  requireAuth,
} from "@/src/modules/auth/rbac";
import {
  generateSignedUpload,
  signUploadSchema,
} from "@/src/modules/receipts/receiptService";

/**
 * POST /api/receipts/sign-upload
 * Returns signed upload parameters for Cloudinary or S3.
 * Validates file type (jpg, png, pdf) and size (max 5 MB).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);

    const body = await req.json();
    const parsed = signUploadSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.format());
    }

    const result = await generateSignedUpload(parsed.data);
    return jsonResponse(result, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return errorResponse("Authentication required", 401);
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 500);
  }
}
