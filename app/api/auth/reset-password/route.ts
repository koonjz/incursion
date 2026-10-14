import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { hashPassword } from "@/src/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Verify token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: cleanEmail,
        token: cleanCode,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid reset code. Please check your inbox and try again." },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expires) {
      await prisma.verificationToken.deleteMany({ where: { identifier: cleanEmail } });
      return NextResponse.json(
        { success: false, error: "Reset code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Delete token once verified
    await prisma.verificationToken.deleteMany({ where: { identifier: cleanEmail } });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this email. Please sign up." },
        { status: 404 }
      );
    }

    const hashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully! You can now sign in with your new password.",
    });
  } catch (err: any) {
    console.error("[reset-password]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
