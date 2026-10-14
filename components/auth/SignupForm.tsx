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
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { useAuth, UserRole } from "@/lib/auth/auth-context";
import { signIn } from "next-auth/react";

type SignupStep = "details" | "verify_code";

export function SignupForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<SignupStep>("details");

  // Form fields
  const [selectedRole, setSelectedRole] = useState<UserRole>("acm_core");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const roleLabels: Record<UserRole, string> = {
    acm_core: "ACM Core",
    acm_executive: "ACM Executive",
    other_club_core: "Other Club Core",
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      if (typeof window !== "undefined") {
        localStorage.setItem("acm_pending_role", selectedRole);
        if (department.trim()) {
          localStorage.setItem("acm_pending_dept", department.trim());
        }
        if (fullName.trim()) {
          localStorage.setItem("acm_pending_name", fullName.trim());
        }
      }
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Unable to initiate Google sign in.");
      setLoading(false);
    }
  };

  // Step 1: Send verification code to email
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanName,
          role: selectedRole,
          department: department.trim() || undefined,
          purpose: "signup",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send activation code. Please try again.");
        setLoading(false);
        return;
      }

      setStep("verify_code");
      setSuccessMessage(`Activation code sent to ${cleanEmail}`);
      setDevCode(data.devCode || null);
      setSandboxNotice(data.sandboxMessage || null);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.message || "Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and register account with password
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError("Please enter the 6-digit activation code.");
      return;
    }

    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
          name: cleanName,
          role: selectedRole,
          department: department.trim() || undefined,
          code: verificationCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // Log in to local AuthContext
      login(selectedRole, cleanEmail, cleanName, department.trim());

      setSuccessMessage("Account created successfully! Redirecting...");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Error completing registration.");
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
            Join ACM Resolve.
          </h1>
          <p className="text-lg text-muted">
            The unified platform for campus event scheduling, instant conflict detection, and streamlined committee approvals.
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
          {step === "details" ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl font-medium text-ink">Sign up</h2>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Already have an account?
                </Link>
              </div>
              <p className="mt-1 text-sm text-muted">
                Create your account to start managing campus events.
              </p>

              {/* Campus Role Selection */}
              <div className="mt-5 space-y-3.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="block text-xs font-semibold uppercase tracking-wider text-blue-300">
                      1. Select Your Campus Role
                    </Label>
                    <span className="text-[11px] text-muted font-medium">Required</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.04] p-1 border border-white/8">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("acm_core")}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold leading-tight transition-all text-center ${
                        selectedRole === "acm_core"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      ACM Core
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("acm_executive")}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold leading-tight transition-all text-center ${
                        selectedRole === "acm_executive"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      ACM Executive
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("other_club_core")}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold leading-tight transition-all text-center ${
                        selectedRole === "other_club_core"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      Other Clubs Core
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="department" className="text-xs">
                      Department / Club
                    </Label>
                    <span className="text-[10px] text-muted">Optional</span>
                  </div>
                  <Input
                    id="department"
                    type="text"
                    placeholder="e.g. Computer Science, Robotics, ACM Chapter..."
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={loading}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Form inputs */}
              <form onSubmit={handleInitiateSignup} className="mt-4 space-y-3.5" noValidate>
                <div>
                  <Label htmlFor="fullName" className="text-xs">
                    Full Name <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Alex Morgan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs">
                    Email address <span className="text-rose-400">*</span>
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
                  <Label htmlFor="password" className="text-xs">
                    Password <span className="text-rose-400">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
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

                <div>
                  <Label htmlFor="confirmPassword" className="text-xs">
                    Confirm Password <span className="text-rose-400">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 rounded"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                      <Loader2 className="animate-spin size-4" /> Sending Activation Code...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4" /> Continue & Send Activation Code
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="relative rounded bg-slate-900/90 px-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                  or sign up with Google
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-3 border-white/10 bg-white/[0.04] text-ink hover:bg-white/[0.08]"
                onClick={handleGoogleSignUp}
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
                Sign up with Google ({roleLabels[selectedRole]})
              </Button>

              <div className="mt-5 text-center">
                <span className="text-xs text-muted">Already have an account? </span>
                <Link href="/login" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* Step 2: Verification Code Entry */
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setStep("details");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
              >
                <ChevronLeft className="size-4" /> Change details or password
              </button>

              <div>
                <div className="inline-flex items-center justify-center size-10 rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 mb-3">
                  <Mail className="size-5" />
                </div>
                <h2 className="font-display text-2xl font-medium text-ink">Verify Your Email</h2>
                <p className="mt-1 text-xs text-muted">
                  We sent a 6-digit activation code to{" "}
                  <strong className="text-ink">{email}</strong>
                </p>
              </div>

              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {sandboxNotice && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs text-amber-300">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <span>{sandboxNotice}</span>
                </div>
              )}

              {devCode && (
                <div className="flex items-center justify-between rounded-xl border border-blue-400/25 bg-blue-400/10 px-3.5 py-2.5 text-xs">
                  <span className="text-blue-200">
                    Test Mode Code: <strong className="font-mono text-sm tracking-wider text-blue-100">{devCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(devCode)}
                    className="font-medium text-blue-300 underline hover:text-blue-200"
                  >
                    Use code
                  </button>
                </div>
              )}

              <form onSubmit={handleCompleteRegistration} className="space-y-4">
                <div>
                  <Label htmlFor="verificationCode" className="text-xs">
                    Enter 6-Digit Code
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setVerificationCode(val);
                    }}
                    className="mt-1.5 h-12 text-center font-mono text-2xl tracking-[0.4em] font-semibold"
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-xs text-rose-300">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={loading || verificationCode.length < 6}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin size-4" /> Creating Account...
                    </>
                  ) : (
                    "Complete Registration & Sign In"
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-muted">Didn&apos;t get the code?</span>
                <button
                  type="button"
                  onClick={handleInitiateSignup}
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
