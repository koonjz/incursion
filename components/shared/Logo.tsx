import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="nx-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f7cff" />
          <stop offset="1" stopColor="#14245c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#nx-g)" />
      <rect x="1" y="1" width="38" height="38" rx="11" fill="none" stroke="rgba(255,255,255,0.28)" />
      <path d="M12 29V11l16 18V11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="11" r="2.4" fill="#f5a15c" />
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
      className={cn("inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-2", className)}
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-tight text-ink">ACM Resolve</span>
        {tagline && <span className="mt-1 text-[11px] text-muted">Campus events</span>}
      </span>
    </Link>
  );
}
