import { cn } from "@/lib/utils";

export function SectionHead({
  eyebrow,
  title,
  text,
  className,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-12 max-w-2xl space-y-3", className)}>
      {eyebrow && (
        <p className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-blue-400">
          <span className="h-px w-6 bg-blue-500/80" />
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
        {title}
      </h2>
      {text && <p className="text-sm sm:text-base leading-relaxed text-zinc-300 font-normal">{text}</p>}
    </div>
  );
}
