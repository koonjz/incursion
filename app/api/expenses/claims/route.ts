import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth/options";
import { listAllClaims, createNewClaim } from "@/src/modules/expenses/claimsService";
import { z } from "zod";

const CreateClaimSchema = z.object({
  eventId: z.string().optional(),
  event: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  merchant: z.string().optional(),
  date: z.string().optional(),
  receiptName: z.string().optional(),
  gstin: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || undefined;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await listAllClaims({
      eventId,
      status,
      category,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[GET /api/expenses/claims]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const body = await req.json();
    const parsed = CreateClaimSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const claim = await createNewClaim({
      ...parsed.data,
      userEmail: session?.user?.email || undefined,
      userName: session?.user?.name || undefined,
    });

    return NextResponse.json(
      { success: true, claim },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/expenses/claims]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
