import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-11 py-2 flex w-full rounded-xl border border-white/12 bg-[#0a0d18] px-3.5 text-sm text-white shadow-inner transition-all duration-200 placeholder:text-zinc-500 hover:border-white/25 focus-visible:outline-none focus-visible:border-blue-500 focus-visible:bg-[#0c1020] focus-visible:ring-2 focus-visible:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
