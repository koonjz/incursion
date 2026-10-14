"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";

import { useAuth, UserRole } from "@/lib/auth/auth-context";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("acm_core");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("acm_resolve_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.name !== "Campus User" && parsed.name !== "Rohan Varma") {
          setFullName(parsed.name);
        }
        if (parsed.email && parsed.email !== "user@campus.edu" && parsed.email !== "rohan.varma@campus.edu") {
          setEmail(parsed.email);
        }
        if (parsed.department) {
          setDepartment(parsed.department);
        }
        if (parsed.role) {
          setSelectedRole(parsed.role);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Unable to initiate Google sign in.");
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("That email address doesn't look right.");
      return;
    }
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName =
      fullName.trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    try {
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          role: selectedRole,
          department: department.trim() || undefined,
        }),
      });
    } catch (err) {
      console.warn("Could not save profile to database", err);
    }

    login(selectedRole, cleanEmail, cleanName, department.trim());
    const destination =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard"
        : "/dashboard";

    setTimeout(() => {
      window.location.href = destination;
    }, 100);
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
          <h1 className="font-display text-5xl font-medium leading-[1.08] text-ink">Welcome back.</h1>
          <p className="text-lg text-muted">
            Submit events, follow their review, and see your club&apos;s schedule in one place.
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
          <h2 className="font-display text-3xl font-medium text-ink">Sign in</h2>
          <p className="mt-1.5 text-sm text-muted">Enter your campus details to access your dashboard.</p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-5 w-full flex items-center justify-center gap-3 border-white/10 bg-white/[0.04] text-ink hover:bg-white/[0.08]"
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

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-white/10" />
            <span className="relative rounded bg-slate-900/90 px-2 text-[11px] font-medium uppercase tracking-wider text-muted">
              or enter account details
            </span>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu or name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error && !email.trim()}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="block text-xs font-medium uppercase tracking-wider text-muted">Select Campus Role</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.04] p-1 border border-white/8">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("acm_core")}
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
                  onClick={() => handleRoleSelect("acm_executive")}
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
                  onClick={() => handleRoleSelect("other_club_core")}
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
                <Label htmlFor="department">Department / Club</Label>
                <span className="text-[11px] text-muted">Optional</span>
              </div>
              <Input
                id="department"
                type="text"
                placeholder="e.g. Computer Science, ACM Chapter, Robotics..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error && !password}
                  disabled={loading}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/8 hover:text-ink"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-300">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Signing in
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Demo mode: any email and password will open the dashboard with your specified profile.
          </p>
        </div>
      </div>
    </div>
  );
}
