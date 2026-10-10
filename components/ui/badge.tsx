import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-blue-400/25 bg-white/5 text-blue-300",
        secondary: "border-white/10 bg-white/[0.06] text-body",
        outline: "border-white/18 bg-transparent text-body",
        approved: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
        pending: "border-blue-400/25 bg-blue-400/15 text-blue-100",
        draft: "border-white/12 bg-white/5 text-slate-300",
        changesRequested: "border-amber-400/25 bg-amber-400/10 text-amber-300",
        rejected: "border-rose-400/25 bg-rose-400/10 text-rose-300",
        critical: "border-rose-400/25 bg-rose-400/10 text-rose-300",
        high: "border-orange-400/25 bg-orange-400/10 text-orange-300",
        medium: "border-amber-400/25 bg-amber-400/10 text-amber-300",
        low: "border-white/12 bg-white/5 text-slate-300",
        none: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
