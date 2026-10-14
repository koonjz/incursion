import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, department } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || "").trim() || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    const rbacRole: Role =
      role === "acm_core"
        ? Role.ADMIN
        : role === "acm_executive"
        ? Role.ORGANIZER
        : Role.STUDENT;

    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: cleanName,
        role: rbacRole,
        department: department || undefined,
        isActive: true,
      },
      create: {
        email: cleanEmail,
        name: cleanName,
        role: rbacRole,
        department: department || "General",
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[POST /api/auth/profile]", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ success: false, error: "Email query param required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[GET /api/auth/profile]", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}
