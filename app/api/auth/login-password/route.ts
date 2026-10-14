import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verifyPassword } from "@/src/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Please enter your email and password." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_FOUND",
          error: "No account found with this email. Please sign up to create one.",
        },
        { status: 404 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          code: "ACCOUNT_DEACTIVATED",
          error: "This campus account has been deactivated. Please contact your administrator.",
        },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          code: "NO_PASSWORD_SET",
          error: "No password has been set for this account yet. Click 'Forgot password' below to set your password, or sign in with Google.",
        },
        { status: 400 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          error: "Incorrect password. Please try again or click 'Forgot password' to reset it.",
        },
        { status: 401 }
      );
    }

    // Map role for client
    let clientRole = "other_club_core";
    if (user.role === "ADMIN") clientRole = "acm_core";
    else if (user.role === "ORGANIZER") clientRole = "acm_executive";

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
        role: clientRole,
        department: user.department,
        avatar: user.avatar,
      },
    });

    // Clear any previous or chunked session cookies to prevent cross-account pollution
    const oldCookieNames = [
      "__Secure-next-auth.session-token",
      "next-auth.session-token.0",
      "next-auth.session-token.1",
      "__Secure-next-auth.session-token.0",
      "__Secure-next-auth.session-token.1",
      "next-auth.csrf-token",
    ];
    for (const name of oldCookieNames) {
      response.cookies.set(name, "", { path: "/", maxAge: 0, expires: new Date(0) });
    }

    response.cookies.set("next-auth.session-token", cookieToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("[login-password]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to sign in." },
      { status: 500 }
    );
  }
}
