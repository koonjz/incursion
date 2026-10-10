import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, back, actions, meta, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      {back && (
        <Link
          href={back.href}
          className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
          <h1 className="font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">{title}</h1>
          {description && <p className="max-w-2xl text-[15px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {action}
    </div>
  );
}
