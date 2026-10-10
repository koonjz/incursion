"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
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
    // Demo sign-in: replace with your real auth call.
    setTimeout(() => router.push("/dashboard"), 650);
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
          <p className="mt-1.5 text-sm text-muted">Use your campus email address.</p>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error && !email.trim()}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
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

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" /> Signing in
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Demo mode: any email and password will open the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
