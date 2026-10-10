import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn("min-h-28 py-3 leading-relaxed resize-y flex w-full rounded-xl border border-white/14 bg-white/[0.06] px-3.5 text-sm text-ink shadow-[inset_0_1px_2px_rgba(17,34,74,0.04)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted/70 hover:border-white/25 focus-visible:outline-none focus-visible:border-blue-400/70 focus-visible:bg-white/[0.09] focus-visible:ring-4 focus-visible:ring-blue-400/20 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-muted aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-rose-400/25", className)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
