"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { useAuth, UserRole } from "@/lib/auth/auth-context";
import { signIn } from "next-auth/react";

type LoginView = "login" | "forgot_email" | "forgot_verify";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [view, setView] = useState<LoginView>("login");

  // Login credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Do not restore stale email by default so users can log into different accounts cleanly

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanEmail = email.trim().toLowerCase();
      // Force Google account chooser so it doesn't automatically log in with browser default account
      await signIn(
        "google",
        { callbackUrl: "/dashboard" },
        {
          prompt: "select_account",
          ...(cleanEmail && cleanEmail.includes("@") ? { login_hint: cleanEmail } : {}),
        }
      );
    } catch {
      setError("Unable to initiate Google sign in.");
      setLoading(false);
    }
  };

  // Main login with password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // Clear any stale session cookies from previous logins
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});

      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to sign in. Please check your credentials.");
        setLoading(false);
        return;
      }

      const u = data.user;
      login(u.role as UserRole, u.email, u.name, u.department, u.avatar);

      // In background, sync with NextAuth credentials provider if applicable
      try {
        await signIn("credentials", {
          redirect: false,
          email: cleanEmail,
          password: password,
        });
      } catch {
        // non-blocking fallback
      }

      const destination =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard"
          : "/dashboard";

      setTimeout(() => {
        window.location.href = destination;
      }, 100);
    } catch (err: any) {
      setError(err?.message || "Error connecting to authentication server.");
      setLoading(false);
    }
  };

  // Step 1 of Forgot Password: Send reset code
  const handleSendResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: "reset",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send reset code. Please try again.");
        setLoading(false);
        return;
      }

      setView("forgot_verify");
      setSuccessMessage(data.message || `Reset code sent to ${cleanEmail}`);
      setDevCode(data.devCode || null);
      setSandboxNotice(data.sandboxMessage || null);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of Forgot Password: Verify code & save new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setError("Please enter the 6-digit reset code.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: resetCode.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to reset password. Please check the code and try again.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Password reset successfully! Please sign in with your new password.");
      setPassword(newPassword);
      setView("login");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setError(err?.message || "Error updating password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <Logo tagline={false} />
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft /> Back to home
          </Link>
        </Button>
      </div>

      <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16">
        <div className="hidden max-w-md space-y-6 lg:block">
          <h1 className="font-display text-5xl font-medium leading-[1.08] text-ink">
            Welcome back.
          </h1>
          <p className="text-lg text-muted">
            Submit events, follow reviews, check resource availability, and view the schedule in one place.
          </p>
          <ul className="space-y-4 pt-2">
            {[
              { icon: ShieldCheck, text: "Instant conflict checks as you plan" },
              { icon: CalendarCheck2, text: "Clear status on every submission" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-body">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06] text-blue-300 ring-1 ring-white/10">
                  <Icon className="size-[18px]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-strong mx-auto w-full max-w-md rounded-[var(--radius-hero)] p-7 sm:p-9">
          {view === "login" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl font-medium text-ink">Sign in</h2>
                <Link
                  href="/signup"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Create an account
                </Link>
              </div>
              <p className="mt-1 text-sm text-muted">
                Enter your campus email and password to access your dashboard.
              </p>

              {successMessage && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Email & Password Form */}
              <form onSubmit={handlePasswordLogin} className="mt-5 space-y-4" noValidate>
                <div>
                  <Label htmlFor="email" className="text-xs">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@campus.edu or name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot_email");
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 rounded"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-xs text-rose-300">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin size-4" /> Signing in...
                    </>
                  ) : (
                    "Sign in with Password"
                  )}
                </Button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="relative rounded bg-slate-900/90 px-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                  or continue with Google
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-3 border-white/10 bg-white/[0.04] text-ink hover:bg-white/[0.08]"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.87c2.26-2.09 3.67-5.17 3.67-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.64H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.36l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.64l3.98 3.09c.95-2.85 3.6-4.98 6.73-4.98z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="mt-5 text-center">
                <span className="text-xs text-muted">Don&apos;t have an account? </span>
                <Link href="/signup" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                  Sign up
                </Link>
              </div>
            </>
          )}

          {view === "forgot_email" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
              >
                <ChevronLeft className="size-4" /> Back to sign in
              </button>

              <div>
                <div className="inline-flex items-center justify-center size-10 rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 mb-3">
                  <KeyRound className="size-5" />
                </div>
                <h2 className="font-display text-2xl font-medium text-ink">Reset Password</h2>
                <p className="mt-1 text-xs text-muted">
                  Enter your email address to receive a 6-digit password reset code.
                </p>
              </div>

              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <Label htmlFor="resetEmail" className="text-xs">
                    Campus Email Address
                  </Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="you@campus.edu or name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="mt-1"
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-xs text-rose-300">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin size-4" /> Sending Reset Code...
                    </>
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>
            </div>
          )}

          {view === "forgot_verify" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setView("forgot_email");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
              >
                <ChevronLeft className="size-4" /> Change email address
              </button>

              <div>
                <div className="inline-flex items-center justify-center size-10 rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 mb-3">
                  <Lock className="size-5" />
                </div>
                <h2 className="font-display text-2xl font-medium text-ink">Set New Password</h2>
                <p className="mt-1 text-xs text-muted">
                  Enter the 6-digit code sent to <strong className="text-ink">{email}</strong> and your new password.
                </p>
              </div>

              {devCode && (
                <div className="flex items-center justify-between rounded-xl border border-blue-400/25 bg-blue-400/10 px-3.5 py-2.5 text-xs">
                  <span className="text-blue-200">
                    Test Mode Code: <strong className="font-mono text-sm tracking-wider text-blue-100">{devCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setResetCode(devCode)}
                    className="font-medium text-blue-300 underline hover:text-blue-200"
                  >
                    Use code
                  </button>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <Label htmlFor="resetCode" className="text-xs">
                    6-Digit Reset Code
                  </Label>
                  <Input
                    id="resetCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setResetCode(val);
                    }}
                    className="mt-1 text-center font-mono text-xl tracking-[0.3em] font-semibold"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-xs">
                    New Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 rounded"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmNewPassword" className="text-xs">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={loading}
                    className="mt-1"
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-xs text-rose-300">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full mt-2" disabled={loading || resetCode.length < 6}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin size-4" /> Updating Password...
                    </>
                  ) : (
                    "Reset Password & Back to Sign In"
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-muted">Didn&apos;t receive code?</span>
                <button
                  type="button"
                  onClick={() => handleSendResetCode()}
                  disabled={loading || resendCooldown > 0}
                  className="font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
