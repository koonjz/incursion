import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, department } = await req.json();

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName =
      (name || "").trim() ||
      cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up previous tokens for this email
    try {
      await prisma.verificationToken.deleteMany({
        where: { identifier: cleanEmail },
      });

      // Save token in database
      await prisma.verificationToken.create({
        data: {
          identifier: cleanEmail,
          token: code,
          expires,
        },
      });
    } catch (dbErr) {
      console.error("[send-code] Database token storage error:", dbErr);
      return NextResponse.json(
        { success: false, error: "Failed to create verification session. Please try again." },
        { status: 500 }
      );
    }

    const emailSubject = `${code} is your ACM Resolve verification code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #04070f; color: #f1f5f9; padding: 24px; margin: 0; }
          .card { max-width: 480px; margin: 0 auto; background: #0b1120; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .logo { display: inline-block; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 24px; }
          .logo span { color: #3b82f6; }
          h1 { font-size: 22px; margin: 0 0 12px; color: #ffffff; font-weight: 600; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
          .code-box { background: rgba(59, 130, 246, 0.08); border: 1.5px solid rgba(59, 130, 246, 0.35); border-radius: 12px; padding: 18px 24px; text-align: center; margin: 28px 0; }
          .code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #60a5fa; margin-left: 10px; }
          .footer { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">ACM <span>Resolve</span></div>
          <h1>Sign-in Verification Code</h1>
          <p>Hello ${cleanName},</p>
          <p>Use the 6-digit code below to securely sign in to your ACM Resolve account:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p style="font-size: 13px;">This code will expire in <strong>10 minutes</strong>. If you did not request this login code, you can safely disregard this email.</p>
          <div class="footer">
            ACM Resolve &bull; Campus Event Scheduling & Verification Portal
          </div>
        </div>
      </body>
      </html>
    `;

    let emailSent = false;
    let isSandboxRestriction = false;
    let sandboxMessage: string | null = null;

    // 1. Try sending via SMTP (Nodemailer) if configured
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || `"ACM Resolve" <${smtpUser}>`,
          to: cleanEmail,
          subject: emailSubject,
          html,
        });

        emailSent = true;
        console.log(`[send-code] Email sent successfully via SMTP to ${cleanEmail}`);
      } catch (smtpErr) {
        console.warn("[send-code] SMTP send failed, falling back to Resend:", smtpErr);
      }
    }

    // 2. Try sending via Resend if not sent via SMTP
    if (!emailSent && process.env.RESEND_API_KEY) {
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.EMAIL_FROM || "ACM Resolve <onboarding@resend.dev>";

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [cleanEmail],
            subject: emailSubject,
            html,
          }),
        });

        const resData = await res.json();
        if (res.ok) {
          emailSent = true;
          console.log(`[send-code] Email sent successfully via Resend to ${cleanEmail}`);
        } else {
          console.warn("[send-code] Resend error:", resData);
          if (res.status === 403 || resData?.message?.includes("only send testing emails to your own email address")) {
            isSandboxRestriction = true;
            sandboxMessage =
              "Resend Sandbox Restriction: Free test sender onboarding@resend.dev only delivers to the account owner (kunjp0039@gmail.com). To send to other emails, verify a domain on resend.com/domains or configure SMTP.";
          }
        }
      } catch (err: any) {
        console.error("[send-code] Resend fetch error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `A 6-digit code has been sent to ${cleanEmail}.`
        : `Verification code generated for ${cleanEmail}.`,
      emailSent,
      isSandboxRestriction,
      sandboxMessage,
      // Provide dev code for seamless local testing or sandbox email constraints
      devCode: !emailSent || process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (err: any) {
    console.error("[POST /api/auth/send-code] Uncaught error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
