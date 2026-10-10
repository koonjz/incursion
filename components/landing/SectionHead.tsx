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
    <div className={cn("mb-10 max-w-2xl space-y-3", className)}>
      {eyebrow && (
        <p className="inline-flex items-center gap-2 text-sm font-medium text-copper-300">
          <span className="h-px w-6 bg-copper-400/70" />
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-4xl font-medium leading-[1.1] text-ink sm:text-5xl">{title}</h2>
      {text && <p className="text-lg leading-relaxed text-muted">{text}</p>}
    </div>
  );
}
