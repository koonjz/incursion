import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/src/lib/auth/options";
import { APP_CONFIG } from "@/src/config";

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, department } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName =
      (name || "").trim() ||
      cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

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
    let email = searchParams.get("email");
    let tokenName: string | undefined;
    let tokenAvatar: string | undefined;

    // 1. Try getToken from NextAuth JWT
    if (!email) {
      try {
        const token = await getToken({
          req: req as any,
          secret: APP_CONFIG.auth.nextAuthSecret || "m1-auth-default-secret-string-replace-in-production",
        });
        if (token?.email) {
          email = token.email as string;
          if (token.name) tokenName = token.name as string;
          if (token.picture) tokenAvatar = token.picture as string;
        }
      } catch {
        // continue
      }
    }

    // 2. Try getServerSession
    if (!email) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          email = session.user.email;
          if (session.user.name) tokenName = session.user.name;
          if (session.user.image) tokenAvatar = session.user.image;
        }
      } catch {
        // continue
      }
    }

    // 3. Cookie fallback
    if (!email) {
      const cookie =
        req.cookies.get("next-auth.session-token")?.value ||
        req.cookies.get("__Secure-next-auth.session-token")?.value;
      if (cookie && cookie.includes(".")) {
        const parts = cookie.split(".");
        for (const part of parts) {
          try {
            const raw = Buffer.from(part, "base64").toString("utf-8");
            const parsed = JSON.parse(decodeURIComponent(escape(raw)));
            if (parsed?.email) {
              email = parsed.email;
              if (parsed.name) tokenName = parsed.name;
              break;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
      },
    });

    // If user exists but name is generic or missing and token has a real name, update DB
    if (user && tokenName && (user.name === "Campus User" || !user.name || user.name.trim() === "")) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: tokenName, avatar: tokenAvatar || user.avatar },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          avatar: true,
        },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[GET /api/auth/profile]", err);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}
