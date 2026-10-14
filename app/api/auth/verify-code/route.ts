import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { email, code, name, role, department } = await req.json();

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Verify token from database
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: cleanEmail,
        token: cleanCode,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code. Please check your inbox and try again." },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expires) {
      await prisma.verificationToken.deleteMany({ where: { identifier: cleanEmail } });
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Delete token once successfully verified
    await prisma.verificationToken.deleteMany({
      where: { identifier: cleanEmail },
    });

    // Map role
    const rbacRole: Role =
      role === "acm_core"
        ? Role.ADMIN
        : role === "acm_executive"
        ? Role.ORGANIZER
        : Role.STUDENT;

    const roleLabels: Record<string, string> = {
      acm_core: "ACM Core reviewer",
      acm_executive: "ACM Executive",
      other_club_core: "Club Core Member",
    };

    const cleanName =
      (name || "").trim() ||
      cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: cleanName,
        role: rbacRole,
        department: department?.trim() || undefined,
        isActive: true,
      },
      create: {
        email: cleanEmail,
        name: cleanName,
        role: rbacRole,
        department: department?.trim() || "General",
        isActive: true,
      },
    });

    // Generate JWT cookie for NextAuth / middleware guard
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: true,
    };

    const base64Payload = btoa(
      encodeURIComponent(JSON.stringify(tokenPayload)).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
    const cookieToken = `session.${base64Payload}.verified`;

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role || "acm_core",
        roleLabel: roleLabels[role] || "Member",
        department: user.department,
      },
    });

    // Set auth cookie
    response.cookies.set("next-auth.session-token", cookieToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      httpOnly: false,
    });

    if (req.nextUrl.protocol === "https:") {
      response.cookies.set("__Secure-next-auth.session-token", cookieToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: true,
        httpOnly: false,
      });
    }

    return response;
  } catch (err: any) {
    console.error("[POST /api/auth/verify-code] Uncaught error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to verify code. Please try again." },
      { status: 500 }
    );
  }
}
