import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@prisma/client";
import { hashPassword } from "@/src/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role = "acm_core", department, code } = await req.json();

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Verification code is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Verify OTP code from verificationToken table
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: cleanEmail,
        token: cleanCode,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid activation code. Please check your inbox and try again." },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expires) {
      await prisma.verificationToken.deleteMany({ where: { identifier: cleanEmail } });
      return NextResponse.json(
        { success: false, error: "Activation code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Delete token once verified
    await prisma.verificationToken.deleteMany({ where: { identifier: cleanEmail } });

    // 2. Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    const hashedPassword = hashPassword(password);

    const rbacRole: Role =
      role === "acm_core"
        ? Role.ADMIN
        : role === "acm_executive"
        ? Role.ORGANIZER
        : Role.STUDENT;

    const cleanName =
      (name || "").trim() ||
      cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    let user;
    if (existing) {
      // Update existing record with password and profile
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          passwordHash: hashedPassword,
          role: rbacRole,
          department: department?.trim() || existing.department || undefined,
          isActive: true,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: cleanName,
          passwordHash: hashedPassword,
          role: rbacRole,
          department: department?.trim() || "General",
          isActive: true,
        },
      });
    }

    // Generate session token cookie
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
      message: "Account created successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });

    response.cookies.set("next-auth.session-token", cookieToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("[register]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create account." },
      { status: 500 }
    );
  }
}
