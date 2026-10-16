import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="acm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="acm-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="acm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.35" />
        </filter>
      </defs>
      {/* Base container */}
      <rect width="40" height="40" rx="10" fill="url(#acm-grad)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      {/* Subtle interior rim */}
      <rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      
      {/* Geometric ACM Resolve Glyph: Intersecting sync prisms forming 'A' and conflict resolution ring */}
      <path
        d="M20 7L31 29H25.5L20 18L14.5 29H9L20 7Z"
        fill="url(#acm-glow)"
        filter="url(#acm-shadow)"
      />
      {/* Crossbar resolving into a sync loop */}
      <path
        d="M13 22.5H27"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Precision node indicator - Clash resolution active */}
      <circle cx="20" cy="18" r="2.2" fill="#ffffff" />
      <circle cx="31" cy="29" r="1.8" fill="#fbbf24" />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  onClick,
  tagline = true,
}: {
  href?: string;
  className?: string;
  onClick?: () => void;
  tagline?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="ACM Resolve home"
      className={cn("group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2", className)}
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-black tracking-widest text-blue-400">ACM</span>
          <span className="font-display text-xl font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">
            Resolve
          </span>
        </span>
        {tagline && (
          <span className="mt-1 text-[10.5px] font-medium tracking-wide text-zinc-400">
            Campus Event Intelligence
          </span>
        )}
      </span>
    </Link>
  );
}
