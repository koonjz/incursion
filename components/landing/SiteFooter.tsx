import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const COLS = [
  {
    title: "Explore",
    links: [
      { label: "Upcoming events", href: "/#events" },
      { label: "Campus calendar", href: "/#calendar" },
      { label: "Why Resolve", href: "/#about" },
    ],
  },
  {
    title: "Organizers",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Submit an event", href: "/login" },
      { label: "Track submissions", href: "/login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted">
            One shared calendar for campus events, with conflicts caught before they happen.
          </p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="space-y-3">
            <p className="text-sm font-semibold text-ink">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/8">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">© 2026 ACM Resolve. Built for campus.</p>
      </div>
    </footer>
  );
}
