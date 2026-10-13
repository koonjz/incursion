import { NextRequest, NextResponse } from "next/server";
import { getClaimById, updateClaimStatus, deleteClaimById } from "@/src/modules/expenses/claimsService";
import { z } from "zod";

const UpdateClaimSchema = z.object({
  status: z.enum(["approved", "pending", "rejected"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claim = await getClaimById(id);
    if (!claim) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, claim });
  } catch (err) {
    console.error("[GET /api/expenses/claims/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const updated = await updateClaimStatus(id, parsed.data.status);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, claim: updated });
  } catch (err) {
    console.error("[PATCH /api/expenses/claims/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteClaimById(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Claim not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Claim deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/expenses/claims/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
