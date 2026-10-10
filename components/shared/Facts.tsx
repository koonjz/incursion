import { cn } from "@/lib/utils";

/** Icon + label + value row used for date / time / venue facts. */
export function Fact({
  icon,
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300 [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-ink">{children}</p>
      </div>
    </div>
  );
}

export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((t) => (
        <span key={t} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-body">
          {t}
        </span>
      ))}
    </div>
  );
}
