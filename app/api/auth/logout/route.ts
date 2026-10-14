import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token.0",
  "next-auth.session-token.1",
  "__Secure-next-auth.session-token.0",
  "__Secure-next-auth.session-token.1",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.pkce.code_verifier",
  "next-auth.state",
];

function clearAllAuthCookies(res: NextResponse) {
  for (const cookieName of AUTH_COOKIE_NAMES) {
    res.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    });
    // Also clear with non-httpOnly in case client set it
    res.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: false,
      sameSite: "lax",
    });
  }
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });
  clearAllAuthCookies(res);
  return res;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  clearAllAuthCookies(res);
  return res;
}
