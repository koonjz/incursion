import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pb-28">
      <div className="relative overflow-hidden rounded-[var(--radius-hero)] border border-white/15 bg-gradient-to-br from-blue-600/50 via-blue-800/40 to-navy-950 p-8 shadow-[var(--shadow-lift)] sm:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-copper-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
              Ready to put your event on the calendar?
            </h2>
            <p className="text-blue-100/80">Sign in with your campus account to submit and track events.</p>
          </div>
          <Button asChild size="lg" variant="outline" className="border-white/30 bg-white text-navy-950 hover:bg-blue-50">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
